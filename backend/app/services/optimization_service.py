"""Prompt optimization service."""
import json
import logging
import uuid
from typing import Dict, Generator, List, Optional, Tuple

from sqlalchemy.orm import Session, joinedload

from app.callbacks.call_tracker import create_call_tracker
from app.core.langchain_config import create_chat_model
from app.models.optimization_session import OptimizationRound, OptimizationSession
from app.models.prompt import Prompt
from app.models.prompt_version import PromptVersion
from app.schemas.optimization import OptimizationScenario
from app.services.prompt_service import PromptService
from app.utils.token_counter import count_tokens

SUGGESTION_DELIMITER = "---SUGGESTIONS---"
logger = logging.getLogger(__name__)


OPTIMIZATION_TEMPLATES = {
    OptimizationScenario.GENERAL: """You are an expert prompt engineer. Optimize the following prompt to be clearer, more effective, and better structured.

Original prompt:
{prompt}

Provide an optimized version that:
1. Is clearer and more specific
2. Has better structure
3. Gives better results from LLMs

Return only the optimized prompt without explanation.""",
    OptimizationScenario.CONTENT_CREATION: """Optimize this content creation prompt to generate higher quality, more engaging content.

Original:
{prompt}

Make it more creative and inspiring.""",
    OptimizationScenario.CODE_GENERATION: """Optimize this code generation prompt for better code quality and clarity.

Original:
{prompt}

Make it produce cleaner, more maintainable code.""",
    OptimizationScenario.DATA_ANALYSIS: """Optimize this data analysis prompt for more accurate and insightful analysis.

Original:
{prompt}

Make it more precise and analytical, focusing on:
1. Clear data requirements
2. Specific analysis methods
3. Expected output format

Return only the optimized prompt.""",
    OptimizationScenario.CONVERSATION: """Optimize this conversational prompt for more natural and engaging interactions.

Original:
{prompt}

Make it more conversational and user-friendly, with:
1. Clear context setting
2. Natural dialogue flow
3. Appropriate tone and personality

Return only the optimized prompt.""",
}


class OptimizationService:
    """Service for prompt optimization using LLM."""

    @staticmethod
    def optimize_prompt(
        db: Session,
        user_id: str,
        original_prompt: str,
        scenario: OptimizationScenario
    ) -> dict:
        """
        Optimize a prompt using the legacy synchronous endpoint.
        """
        template = OPTIMIZATION_TEMPLATES.get(
            scenario,
            OPTIMIZATION_TEMPLATES[OptimizationScenario.GENERAL]
        )
        optimization_prompt = template.format(prompt=original_prompt)

        callback = create_call_tracker(
            db, user_id,
            chain_type="prompt_optimization",
            scenario=scenario.value
        )
        llm = create_chat_model(temperature=0.7, callbacks=[callback])
        response = llm.invoke(optimization_prompt)
        optimized_content = response.content
        token_count = count_tokens(optimized_content)

        suggestions = [
            "The optimized version is more structured",
            "Added clarity to improve LLM understanding",
            "Improved specificity for better results"
        ]

        return {
            "optimized_content": optimized_content,
            "suggestions": suggestions,
            "token_count": token_count,
            "estimated_cost": 0.001
        }

    @staticmethod
    def get_or_create_session(
        db: Session,
        prompt_id: str,
        user_id: str,
    ) -> OptimizationSession:
        """Load or create optimization session for a prompt."""
        session = db.query(OptimizationSession).filter(
            OptimizationSession.prompt_id == prompt_id,
            OptimizationSession.user_id == user_id,
        ).options(joinedload(OptimizationSession.rounds)).first()
        if session:
            return session

        session = OptimizationSession(
            id=str(uuid.uuid4()),
            prompt_id=prompt_id,
            user_id=user_id,
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        return session

    @staticmethod
    def get_session_with_rounds(
        db: Session,
        prompt_id: str,
        user_id: str,
    ) -> Optional[OptimizationSession]:
        """Get optimization session with all rounds."""
        return db.query(OptimizationSession).filter(
            OptimizationSession.prompt_id == prompt_id,
            OptimizationSession.user_id == user_id,
        ).options(joinedload(OptimizationSession.rounds)).first()

    @staticmethod
    def build_stream_prompt(
        original_prompt: str,
        user_idea: Optional[str],
        selected_suggestions: Optional[Dict[str, List[str]]],
    ) -> str:
        """Build prompt for the SSE optimization flow."""
        return f"""你是一位顶级提示词架构师，同时也是严格的交付标准设计师。你的任务不是“稍微润色”，而是把提示词优化成更完整、更可执行、更稳定、更高质量的版本。

你必须先在心里完成“诊断”，再输出最终结果，但不要把诊断过程写出来。

你的核心目标不是改写得更漂亮，而是把原提示词升级成真正可用的生产级提示词。所谓“生产级”，至少意味着：
1. 模型角色、目标、输入、输出、约束、质量标准彼此一致，没有冲突
2. 指令具体，可执行，可验证，而不是抽象口号
3. 对常见失败点、歧义点、边界情况有防护
4. 输出结果更稳定、更可控、更贴近真实业务需求

你必须同时完成两件事：

【任务一：输出优化后的完整提示词】
请基于原提示词、用户本轮想法、以及用户之前选择的优化方向，重写出一个更强的完整提示词。

在重写前，你必须先隐式判断这段提示词更接近哪一类任务，并采用更适合该任务的结构，而不是机械套模板。任务类型包括但不限于：
- 内容创作/改写
- 总结/分析/提炼
- 分类/抽取/打标
- 对话/客服/助手
- 代码生成/调试/评审
- 翻译/改写/风格迁移
- 规划/决策/方案设计
- 数据分析/报告生成

如果原提示词属于不同任务类型，你必须选择最匹配的结构重点，例如：
- 内容创作类：补足目标受众、风格、语气、篇幅、信息重点、禁忌表达、成品结构
- 总结分析类：补足分析维度、判断标准、证据要求、结论结构、信息不足时的处理方式
- 分类抽取类：补足字段定义、判定规则、优先级、歧义处理、空值处理、输出 schema
- 对话客服类：补足身份边界、回复原则、澄清策略、拒答规则、情绪与语气约束
- 代码类：补足技术栈、输入上下文、实现约束、错误处理、测试要求、输出格式

优化时必须优先检查并补强这些维度：
1. 角色定义是否清晰，是否真的有助于任务完成
2. 任务目标是否明确，是否包含成功标准和优先级
3. 输入信息该如何理解、筛选、补充、澄清、分类
4. 输出格式、输出结构、字段要求、语言要求是否明确
5. 质量标准、验收标准、判断标准、禁止事项是否明确
6. 异常情况、信息不足、输入冲突、边界场景如何处理
7. 是否存在空泛、重复、含糊、互相冲突、无法执行的表达

优化后的提示词必须尽量具备以下结构模块；如果某模块确实不适用，可以省略，但不能为了省略而省略：
- 角色 / 身份
- 任务目标
- 输入处理规则
- 执行要求 / 推理要求
- 输出格式 / 输出字段
- 质量标准 / 验收标准
- 约束 / 禁止事项
- 边界场景 / 失败处理

优化后的结果必须满足：
1. 保留用户原始意图，不要偏题，不要擅自改变核心任务
2. 明显增强结构与可执行性，不能只是同义词替换或语气润色
3. 尽量补足缺失的执行规则、输出契约、质量要求、失败处理
4. 避免空洞套话，避免“更专业”“更高质量”“更加详细”这类不可操作的表达
5. 如果原提示词已经有价值内容，应该保留并增强，而不是全部覆盖成模板腔
6. 输出的最终提示词应该能直接复制给另一个模型使用

严格禁止以下行为：
1. 输出“优化思路”“优化说明”“优化后的提示词如下”“下面是优化版本”等任何前言或说明
2. 重复原提示词却几乎没有结构升级
3. 加入与原任务无关的能力、目标或设定
4. 使用空泛大词替代具体规则
5. 把提示词写成过度僵硬、明显 AI 模板化的样子

【任务二：生成下一轮可选优化建议】
输出 3 到 5 个“继续优化”的关键问题，每个问题给 3 到 5 个可选项。

这些问题必须满足：
1. 聚焦真正影响结果质量的高价值决策点
2. 问题之间尽量不要重复
3. 选项必须具体、互相可区分、便于用户选择
4. 不要提那些对结果影响很小的表面问题

优先考虑的建议方向包括但不限于：
- 是否固定输出格式 / schema / 模板
- 是否增加评分标准 / 优先级 / 验收标准
- 是否加入示例 / 反例 / few-shot
- 是否限定语气、受众、篇幅、风格
- 是否增加边界场景、拒答规则、异常输入处理
- 是否明确步骤顺序、思考深度、信息不足时的澄清策略

当前提示词：
{original_prompt}

用户本轮想法：
{user_idea or "无"}

用户已选择建议：
{json.dumps(selected_suggestions or {}, ensure_ascii=False)}

输出必须严格遵守以下格式，不要输出任何解释、前言或说明：

第一部分：
直接输出“优化后的完整提示词正文”，纯文本即可，不要加标题，不要加标签，不要加引导语。

第二部分：
单独一行输出分隔符：
{SUGGESTION_DELIMITER}

第三部分：
输出合法 JSON，格式如下：
{{"domain":"提示词所属领域","questions":[{{"question":"问题","options":["选项1","选项2","选项3"]}}]}}"""

    @staticmethod
    def extract_chunk_text(chunk: object) -> str:
        """Extract plain text content from LangChain stream chunks."""
        content = getattr(chunk, "content", "")

        if isinstance(content, str):
            return content

        if isinstance(content, list):
            parts: List[str] = []
            for item in content:
                if isinstance(item, str):
                    parts.append(item)
                elif isinstance(item, dict):
                    text = item.get("text")
                    if isinstance(text, str):
                        parts.append(text)
                else:
                    text = getattr(item, "text", None)
                    if isinstance(text, str):
                        parts.append(text)
            return "".join(parts)

        return str(content or "")

    @staticmethod
    def parse_structured_response(response_text: str) -> Tuple[str, str, List[Dict[str, List[str]]]]:
        """Split optimized content and suggestions."""
        if "---SUGGESTIONS---" not in response_text:
            return response_text.strip(), "", []

        content_part, suggestion_part = response_text.split("---SUGGESTIONS---", 1)
        optimized_content = content_part.strip()
        suggestion_payload = suggestion_part.strip()

        try:
            suggestion_json = json.loads(suggestion_payload)
        except json.JSONDecodeError:
            return optimized_content, "", []

        domain_analysis = suggestion_json.get("domain", "") if isinstance(suggestion_json, dict) else ""
        raw_questions = suggestion_json.get("questions", []) if isinstance(suggestion_json, dict) else []
        questions: List[Dict[str, List[str]]] = []
        if isinstance(raw_questions, list):
            for item in raw_questions:
                if not isinstance(item, dict):
                    continue
                question = item.get("question")
                options = item.get("options", [])
                if not question:
                    continue
                questions.append({
                    "question": str(question),
                    "options": [str(option) for option in options] if isinstance(options, list) else [],
                })

        return optimized_content, domain_analysis, questions

    @staticmethod
    def optimize_prompt_stream(
        db: Session,
        user_id: str,
        prompt: Prompt,
        version: PromptVersion,
        user_idea: Optional[str] = None,
        selected_suggestions: Optional[Dict[str, List[str]]] = None,
    ) -> Generator[dict, None, Optional[OptimizationRound]]:
        """Run optimization and emit SSE-style events."""
        session = OptimizationService.get_or_create_session(db, prompt.id, user_id)
        round_number = len(session.rounds) + 1

        yield {"type": "round_start", "data": {"round_number": round_number}}

        callback = create_call_tracker(
            db,
            user_id,
            chain_type="prompt_optimization_stream",
            scenario=f"prompt:{prompt.id}:version:{version.version_number}",
        )
        llm = create_chat_model(temperature=0.4, callbacks=[callback])
        prompt_text = OptimizationService.build_stream_prompt(
            original_prompt=version.content,
            user_idea=user_idea,
            selected_suggestions=selected_suggestions,
        )

        full_response = ""
        streamed_content = ""
        delimiter_guard = max(len(SUGGESTION_DELIMITER) - 1, 0)

        try:
            stream_error: Optional[Exception] = None
            stream_method = getattr(llm, "stream", None)

            if callable(stream_method):
                try:
                    for chunk in stream_method(prompt_text):
                        chunk_text = OptimizationService.extract_chunk_text(chunk)
                        if not chunk_text:
                            continue

                        full_response += chunk_text

                        if SUGGESTION_DELIMITER in full_response:
                            content_part = full_response.split(SUGGESTION_DELIMITER, 1)[0].rstrip()
                            new_content = content_part[len(streamed_content):]
                            if new_content:
                                streamed_content += new_content
                                yield {"type": "content", "data": new_content}
                            continue

                        safe_length = max(0, len(full_response) - delimiter_guard)
                        if safe_length <= len(streamed_content):
                            continue

                        safe_content = full_response[:safe_length]
                        new_content = safe_content[len(streamed_content):]
                        if new_content:
                            streamed_content += new_content
                            yield {"type": "content", "data": new_content}
                except Exception as exc:
                    if full_response:
                        raise
                    stream_error = exc

            if not full_response:
                if stream_error is not None:
                    raise stream_error

                response = llm.invoke(prompt_text)
                full_response = OptimizationService.extract_chunk_text(response)

            optimized_content, domain_analysis, suggestions = OptimizationService.parse_structured_response(full_response)
            if not optimized_content:
                optimized_content = version.content

            remaining_content = optimized_content[len(streamed_content):]
            if remaining_content:
                yield {"type": "content", "data": remaining_content}

            new_version = PromptService.create_prompt_version(
                db=db,
                prompt=prompt,
                content=optimized_content,
                change_note=f"优化第 {round_number} 轮",
            )

            round_record = OptimizationRound(
                id=str(uuid.uuid4()),
                session_id=session.id,
                round_number=round_number,
                user_idea=user_idea,
                selected_suggestions=selected_suggestions,
                optimized_content=optimized_content,
                suggestions=suggestions,
                domain_analysis=domain_analysis,
                version_id=new_version.id,
            )
            db.add(round_record)
            db.commit()
            db.refresh(round_record)
            db.refresh(new_version)

            yield {"type": "suggestions", "data": {"questions": suggestions, "domain": domain_analysis}}
            yield {"type": "version_saved", "data": {"version_id": new_version.id, "version_number": new_version.version_number}}
            yield {"type": "complete", "data": {}}
            return round_record
        except Exception as exc:
            db.rollback()
            logger.exception(
                "Optimization stream failed for prompt %s version %s",
                prompt.id,
                version.id,
            )
            yield {"type": "error", "data": {"message": str(exc)}}
            return None

    @staticmethod
    def chunk_text(text: str, chunk_size: int = 80) -> List[str]:
        """Split text into small chunks to simulate streaming."""
        if not text:
            return [""]
        return [text[index:index + chunk_size] for index in range(0, len(text), chunk_size)]
