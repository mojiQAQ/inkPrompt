"""
Initialize system data (preset tags, curated square prompts, etc.)
"""
import json
import uuid

from sqlalchemy.orm import Session

from app.models.prompt import Prompt
from app.models.prompt_square import PromptSquareEntry
from app.models.prompt_version import PromptVersion
from app.models.tag import Tag
from app.models.user import User
from app.utils.token_counter import count_tokens


# System preset tags
SYSTEM_TAGS = [
    # 用途分类
    {"name": "代码生成", "category": "用途"},
    {"name": "代码审查", "category": "用途"},
    {"name": "文案创作", "category": "用途"},
    {"name": "翻译", "category": "用途"},
    {"name": "总结", "category": "用途"},
    {"name": "分析", "category": "用途"},
    {"name": "头脑风暴", "category": "用途"},

    # 领域分类
    {"name": "前端开发", "category": "领域"},
    {"name": "后端开发", "category": "领域"},
    {"name": "数据分析", "category": "领域"},
    {"name": "机器学习", "category": "领域"},
    {"name": "产品设计", "category": "领域"},
    {"name": "市场营销", "category": "领域"},

    # 语言/技术
    {"name": "Python", "category": "技术"},
    {"name": "JavaScript", "category": "技术"},
    {"name": "TypeScript", "category": "技术"},
    {"name": "React", "category": "技术"},
    {"name": "Vue", "category": "技术"},
    {"name": "SQL", "category": "技术"},

    # 风格
    {"name": "专业", "category": "风格"},
    {"name": "简洁", "category": "风格"},
    {"name": "详细", "category": "风格"},
    {"name": "创意", "category": "风格"},
]

CURATED_SQUARE_AUTHOR = {
    "id": "00000000-0000-0000-0000-000000000001",
    "email": "square-curator@inkprompt.local",
    "full_name": "Ink & Prompt 官方精选",
}

CURATED_SQUARE_PROMPTS = [
    {
        "prompt_id": "00000000-0000-0000-0000-000000000101",
        "version_id": "00000000-0000-0000-0000-000000000201",
        "entry_id": "00000000-0000-0000-0000-000000000301",
        "name": "结构化问题分析师",
        "title": "结构化问题分析师",
        "summary": "适合在信息杂乱时快速梳理目标、事实、关键缺口和下一步动作，让讨论从发散回到可执行。",
        "category": "analysis",
        "difficulty": "simple",
        "recommended_models": ["gpt-4.1", "claude-sonnet-4-6"],
        "tag_names": ["分析", "专业", "详细"],
        "content": """你是一位结构化问题分析顾问。请基于我提供的问题，严格按下面结构输出：

1. 问题定义
- 用一句话重述我真正要解决的问题
- 明确目标、边界与成功标准

2. 已知事实
- 只列出我已经明确提供的信息
- 不要把猜测当作事实

3. 关键缺口
- 指出还缺哪些信息会影响判断
- 如果信息不足，先提出最多 5 个澄清问题

4. 拆解框架
- 从模块 / 流程 / 角色三个维度拆解问题
- 每个维度都说明为什么重要

5. 优先级判断
- 按“影响度 x 紧急度”给出优先级
- 说明排序依据

6. 下一步建议
- 给出 3-5 条可立即执行的动作
- 每条都要明确负责人、预期产出和风险提示

要求：
- 用中文回答
- 结论必须对应事实
- 不说空话，不堆概念
- 如果存在明显假设，请单独标出“假设”""",
    },
    {
        "prompt_id": "00000000-0000-0000-0000-000000000102",
        "version_id": "00000000-0000-0000-0000-000000000202",
        "entry_id": "00000000-0000-0000-0000-000000000302",
        "name": "代码审查与重构建议",
        "title": "代码审查与重构建议",
        "summary": "适合在提交 PR、修复杂逻辑或准备重构前，快速识别真实风险、行为回归和测试缺口。",
        "category": "coding",
        "difficulty": "advanced",
        "recommended_models": ["claude-sonnet-4-6", "gpt-4.1"],
        "tag_names": ["代码审查", "前端开发", "后端开发", "专业"],
        "content": """你是一位资深工程师，请对我提供的代码、Diff 或方案做严格代码审查。

请按以下顺序输出：

1. 高优先级问题
- 先指出真实 bug、边界条件、行为回归、性能风险、安全问题
- 每条都说明为什么严重、会在什么场景触发

2. 中优先级问题
- 指出可维护性、结构复杂度、命名歧义、隐性耦合

3. 测试建议
- 说明缺哪些单测 / 集成测试 / 回归用例
- 给出最值得先补的测试场景

4. 重构建议
- 提供最小可行修改方案
- 优先降低风险，而不是大改风格

5. 改后示例
- 如果有必要，给出关键伪代码或代码片段

要求：
- 结论基于代码本身，不要泛泛而谈
- 如果没有明显问题，就明确写“未发现高风险问题”
- 输出用中文
- 反馈风格专业、直接、可执行""",
    },
    {
        "prompt_id": "00000000-0000-0000-0000-000000000103",
        "version_id": "00000000-0000-0000-0000-000000000203",
        "entry_id": "00000000-0000-0000-0000-000000000303",
        "name": "长文总结与行动项提炼",
        "title": "长文总结与行动项提炼",
        "summary": "适合处理会议纪要、访谈、日报、技术文档等长文本，快速拿到摘要、重点和待办。",
        "category": "education",
        "difficulty": "simple",
        "recommended_models": ["gpt-4.1-mini", "claude-sonnet-4-6"],
        "tag_names": ["总结", "详细", "专业"],
        "content": """请把我提供的长文本整理成一份高密度总结，输出格式如下：

1. 一句话摘要
- 用一句话概括核心主题

2. 关键结论
- 提炼 3-6 条最重要的信息
- 每条都尽量保留原文中的因果关系

3. 行动项
- 列出需要继续跟进的事项
- 用“事项 / 负责人 / 截止时间 / 风险”四列输出
- 如果原文没有明确负责人或时间，标记为“待确认”

4. 重要细节
- 补充容易被忽略但影响决策的信息

5. 可继续追问的问题
- 给出 3 个值得继续澄清的问题

要求：
- 不要逐段复述原文
- 区分“事实”“判断”“待确认”
- 输出用中文，结构清晰，适合直接发给团队""",
    },
    {
        "prompt_id": "00000000-0000-0000-0000-000000000104",
        "version_id": "00000000-0000-0000-0000-000000000204",
        "entry_id": "00000000-0000-0000-0000-000000000304",
        "name": "需求拆解为执行计划",
        "title": "需求拆解为执行计划",
        "summary": "适合把模糊需求、想法或 PRD 初稿，快速转成可评审、可排期、可落地的执行方案。",
        "category": "general",
        "difficulty": "medium",
        "recommended_models": ["claude-sonnet-4-6", "gpt-4.1"],
        "tag_names": ["产品设计", "分析", "专业"],
        "content": """你现在是一位资深产品经理兼技术项目负责人。请把我给出的需求或想法拆成一份执行计划。

输出结构：

1. 目标与价值
- 这件事解决谁的问题
- 为什么现在值得做

2. 用户场景
- 列出核心使用场景
- 说明成功体验是什么

3. 范围划分
- 哪些内容属于本期必须做
- 哪些可以延后
- 哪些明确不做

4. 功能拆解
- 按页面 / 接口 / 数据 / 权限 / 埋点拆解
- 每项都写清输入、输出和依赖

5. 风险与边界
- 列出最容易遗漏的 5 个边界情况
- 说明对应处理建议

6. 交付建议
- 给出一个从 0 到 1 的实施顺序
- 标注哪些任务可以并行

要求：
- 输出必须能直接给产品、设计、研发一起评审
- 不要停留在抽象层
- 用中文，结构清晰""",
    },
    {
        "prompt_id": "00000000-0000-0000-0000-000000000105",
        "version_id": "00000000-0000-0000-0000-000000000205",
        "entry_id": "00000000-0000-0000-0000-000000000305",
        "name": "多版本营销文案生成器",
        "title": "多版本营销文案生成器",
        "summary": "适合在一个输入里同时产出多种语气和角度的营销文案，方便你快速筛选可投放版本。",
        "category": "marketing",
        "difficulty": "medium",
        "recommended_models": ["gpt-4.1", "claude-sonnet-4-6"],
        "tag_names": ["市场营销", "文案创作", "创意"],
        "content": """你是一位懂增长的品牌文案策划。请基于我提供的产品、用户和投放场景，输出多版本营销文案。

请按以下格式回答：

1. 用户洞察
- 目标用户最在意什么
- 当前文案最该抓住的情绪或利益点

2. 核心卖点提炼
- 提炼 3 个最有传播力的卖点
- 每个卖点都写成一句易传播表达

3. 文案版本
- 输出 5 个不同方向的版本
- 每个版本包含：标题、开头一句、正文、CTA
- 风格分别覆盖：专业理性、轻松亲切、强利益点、故事感、社交传播感

4. 投放建议
- 说明每个版本更适合的渠道
- 给出 A/B 测试建议

要求：
- 避免空泛夸张词
- 尽量具体，写出真实使用场景
- 输出用中文，可直接继续改写或投放""",
    },
]


def init_system_tags(db: Session) -> int:
    """
    Initialize system preset tags

    Args:
        db: Database session

    Returns:
        Number of tags created
    """
    created_count = 0

    for tag_data in SYSTEM_TAGS:
        # Check if tag already exists
        existing_tag = db.query(Tag).filter(
            Tag.name == tag_data["name"],
            Tag.is_system == True
        ).first()

        if not existing_tag:
            # Create new system tag
            tag = Tag(
                id=str(uuid.uuid4()),
                name=tag_data["name"],
                is_system=True,
                user_id=None,
                use_count=0
            )
            db.add(tag)
            created_count += 1

    db.commit()

    return created_count


def init_curated_square_entries(db: Session) -> int:
    """
    Initialize curated prompt square entries so the square is not empty on first run.

    Args:
        db: Database session

    Returns:
        Number of square entries created
    """
    created_count = 0

    curator = db.query(User).filter(User.id == CURATED_SQUARE_AUTHOR["id"]).first()
    if not curator:
        curator = User(
            id=CURATED_SQUARE_AUTHOR["id"],
            email=CURATED_SQUARE_AUTHOR["email"],
            full_name=CURATED_SQUARE_AUTHOR["full_name"],
        )
        db.add(curator)
        db.flush()

    for item in CURATED_SQUARE_PROMPTS:
        existing_entry = db.query(PromptSquareEntry).filter(
            PromptSquareEntry.id == item["entry_id"]
        ).first()
        if existing_entry:
            continue

        prompt = db.query(Prompt).filter(Prompt.id == item["prompt_id"]).first()
        if not prompt:
            prompt = Prompt(
                id=item["prompt_id"],
                user_id=curator.id,
                name=item["name"],
                content=item["content"],
                token_count=count_tokens(item["content"]),
            )
            db.add(prompt)
            db.flush()

        existing_version = db.query(PromptVersion).filter(
            PromptVersion.id == item["version_id"]
        ).first()
        if not existing_version:
            db.add(
                PromptVersion(
                    id=item["version_id"],
                    prompt_id=prompt.id,
                    version_number=1,
                    content=prompt.content,
                    token_count=prompt.token_count,
                    change_note="官方精选初始版本",
                )
            )

        prompt.tags = []
        for tag_name in item["tag_names"]:
            tag = db.query(Tag).filter(
                Tag.name == tag_name,
                Tag.is_system == True,
            ).first()
            if not tag:
                tag = Tag(
                    id=str(uuid.uuid4()),
                    name=tag_name,
                    is_system=True,
                    user_id=None,
                    use_count=0,
                )
                db.add(tag)
                db.flush()

            if tag not in prompt.tags:
                prompt.tags.append(tag)
                tag.use_count += 1

        db.add(
            PromptSquareEntry(
                id=item["entry_id"],
                prompt_id=prompt.id,
                user_id=curator.id,
                title=item["title"],
                summary=item["summary"],
                category=item["category"],
                difficulty=item["difficulty"],
                recommended_models=json.dumps(item["recommended_models"], ensure_ascii=False),
                content_snapshot=item["content"],
                allow_full_preview=True,
                status="published",
                moderation_status="approved",
                views=0,
                likes=0,
                favorites=0,
                copies=0,
            )
        )
        created_count += 1

    db.commit()
    return created_count


def reset_system_tags(db: Session) -> int:
    """
    Reset all system tags (delete and recreate)

    Args:
        db: Database session

    Returns:
        Number of tags created
    """
    # Delete all existing system tags
    db.query(Tag).filter(Tag.is_system == True).delete()
    db.commit()

    # Recreate system tags
    return init_system_tags(db)
