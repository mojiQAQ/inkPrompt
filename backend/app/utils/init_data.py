"""
Initialize system data (preset tags, etc.)
"""
import uuid
from sqlalchemy.orm import Session
from app.models.tag import Tag


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
