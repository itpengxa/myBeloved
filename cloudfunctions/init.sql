-- 心上人 数据库初始化脚本
-- 运行方式: mysql -u root -p < init.sql

CREATE DATABASE IF NOT EXISTS xinshangren_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE xinshangren_db;

-- 用户基础信息表
CREATE TABLE IF NOT EXISTS users (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    openid          VARCHAR(64) NOT NULL UNIQUE COMMENT '微信openid',
    unionid         VARCHAR(64) COMMENT '微信unionid',
    nickname        VARCHAR(64) COMMENT '微信昵称',
    avatar_url      VARCHAR(512) COMMENT '微信头像URL',
    gender          TINYINT DEFAULT 0 COMMENT '0未知 1男 2女',
    phone           VARCHAR(20) COMMENT '手机号',
    status          TINYINT DEFAULT 1 COMMENT '0禁用 1正常',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_openid (openid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户基础信息表';

-- 对象绑定关系表
CREATE TABLE IF NOT EXISTS partners (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id         BIGINT NOT NULL COMMENT '发起绑定用户ID',
    partner_id      BIGINT NOT NULL COMMENT '被绑定对象用户ID',
    bind_status     TINYINT DEFAULT 0 COMMENT '0待确认 1已绑定 2已拒绝 3已解绑',
    bind_code       VARCHAR(8) COMMENT '绑定验证码（6位数字）',
    bind_msg        VARCHAR(200) COMMENT '绑定留言/验证消息',
    bind_at         DATETIME COMMENT '绑定成功时间',
    unbind_at       DATETIME COMMENT '解绑时间',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_partner (user_id, partner_id),
    INDEX idx_bind_code (bind_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='对象绑定关系表';

-- 生活点滴记录表
CREATE TABLE IF NOT EXISTS moments (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id         BIGINT NOT NULL COMMENT '发布用户ID',
    partner_id      BIGINT COMMENT '关联对象ID（可选）',
    content         TEXT COMMENT '文字内容',
    images          JSON COMMENT '图片URL数组',
    location        VARCHAR(200) COMMENT '位置信息',
    latitude        DECIMAL(10,8) COMMENT '纬度',
    longitude       DECIMAL(11,8) COMMENT '经度',
    weather         VARCHAR(50) COMMENT '天气信息',
    mood            VARCHAR(20) COMMENT '心情标签',
    tags            JSON COMMENT '标签数组',
    is_shared       TINYINT DEFAULT 0 COMMENT '0仅自己 1双方可见',
    like_count      INT DEFAULT 0 COMMENT '点赞数',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_created (user_id, created_at),
    INDEX idx_partner (partner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='生活点滴记录表';

-- 特别提醒设置表
CREATE TABLE IF NOT EXISTS reminders (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id         BIGINT NOT NULL COMMENT '所属用户ID',
    partner_id      BIGINT COMMENT '关联对象ID',
    title           VARCHAR(100) NOT NULL COMMENT '提醒标题',
    reminder_type   TINYINT NOT NULL COMMENT '1生日 2纪念日 3自定义',
    target_date     DATE NOT NULL COMMENT '目标日期',
    is_lunar        TINYINT DEFAULT 0 COMMENT '0公历 1农历',
    advance_days    INT DEFAULT 1 COMMENT '提前提醒天数',
    notify_time     TIME DEFAULT '09:00:00' COMMENT '通知时间',
    repeat_type     TINYINT DEFAULT 1 COMMENT '0不重复 1每年 2每月 3每周',
    notify_target   TINYINT DEFAULT 3 COMMENT '1仅自己 2仅对象 3双方',
    status          TINYINT DEFAULT 1 COMMENT '0关闭 1开启',
    last_notify_date DATE COMMENT '最后通知日期',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_date (user_id, target_date),
    INDEX idx_notify_time (notify_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='特别提醒设置表';

-- 普通通知频率设置表
CREATE TABLE IF NOT EXISTS notify_settings (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id         BIGINT NOT NULL UNIQUE COMMENT '用户ID',
    daily_notify    TINYINT DEFAULT 1 COMMENT '0关闭 1开启 每日',
    weekly_notify   TINYINT DEFAULT 1 COMMENT '0关闭 1开启 每周',
    monthly_notify  TINYINT DEFAULT 1 COMMENT '0关闭 1开启 每月',
    weekly_day      TINYINT DEFAULT 1 COMMENT '周几发送 1-7',
    monthly_day     TINYINT DEFAULT 1 COMMENT '每月几号发送 1-31',
    notify_time     TIME DEFAULT '20:00:00' COMMENT '发送时间',
    notify_target   TINYINT DEFAULT 3 COMMENT '1仅自己 2仅对象 3双方',
    ai_style        VARCHAR(20) DEFAULT 'romantic' COMMENT 'AI风格 romantic/poetic/playful',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='普通通知频率设置表';

-- 7日主动情书表
CREATE TABLE IF NOT EXISTS love_letters (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id         BIGINT NOT NULL COMMENT '发送方用户ID',
    partner_id      BIGINT NOT NULL COMMENT '接收方用户ID',
    letter_content  TEXT NOT NULL COMMENT 'AI生成的情书内容',
    food_recommend  JSON COMMENT '推荐美食',
    activity_recommend JSON COMMENT '推荐娱乐活动',
    todo_list       JSON COMMENT '情侣必做两件事',
    based_moments   JSON COMMENT '基于哪些点滴生成的ID数组',
    send_date       DATE NOT NULL COMMENT '发送日期',
    send_status     TINYINT DEFAULT 0 COMMENT '0待发送 1已发送 2发送失败',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_date (user_id, send_date),
    INDEX idx_send_status (send_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='7日主动情书表';

-- 微信订阅消息授权记录
CREATE TABLE IF NOT EXISTS subscriptions (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id         BIGINT NOT NULL COMMENT '用户ID',
    template_id     VARCHAR(64) NOT NULL COMMENT '模板ID',
    subscribe_count INT DEFAULT 0 COMMENT '剩余可推送次数',
    last_subscribe  DATETIME COMMENT '最后授权时间',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_template (user_id, template_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='微信订阅消息授权记录';

-- 评论表
CREATE TABLE IF NOT EXISTS comments (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    moment_id       BIGINT NOT NULL COMMENT '点滴ID',
    user_id         BIGINT NOT NULL COMMENT '评论用户ID',
    content         VARCHAR(500) NOT NULL COMMENT '评论内容',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_moment (moment_id),
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='点滴评论表';
