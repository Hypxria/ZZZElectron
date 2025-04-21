export interface genshinNotes {
    retcode: number;
    message: string;
    data:    Data;
}

export interface Data {
    current_resin:                 number;
    max_resin:                     number;
    resin_recovery_time:           string;
    finished_task_num:             number;
    total_task_num:                number;
    is_extra_task_reward_received: boolean;
    remain_resin_discount_num:     number;
    resin_discount_num_limit:      number;
    current_expedition_num:        number;
    max_expedition_num:            number;
    expeditions:                   Expedition[];
    current_home_coin:             number;
    max_home_coin:                 number;
    home_coin_recovery_time:       string;
    calendar_url:                  string;
    transformer:                   Transformer;
    daily_task:                    DailyTask;
    archon_quest_progress:         ArchonQuestProgress;
}

export interface ArchonQuestProgress {
    list:                       List[];
    is_open_archon_quest:       boolean;
    is_finish_all_mainline:     boolean;
    is_finish_all_interchapter: boolean;
    wiki_url:                   string;
}

export interface List {
    status:        string;
    chapter_num:   string;
    chapter_title: string;
    id:            number;
    chapter_type:  number;
}

export interface DailyTask {
    total_num:                           number;
    finished_num:                        number;
    is_extra_task_reward_received:       boolean;
    task_rewards:                        TaskReward[];
    attendance_rewards:                  AttendanceReward[];
    attendance_visible:                  boolean;
    stored_attendance:                   string;
    stored_attendance_refresh_countdown: number;
}

export interface AttendanceReward {
    status:   string;
    progress: number;
}

export interface TaskReward {
    status: string;
}

export interface Expedition {
    avatar_side_icon: string;
    status:           string;
    remained_time:    string;
}

export interface Transformer {
    obtained:      boolean;
    recovery_time: RecoveryTime;
    wiki:          string;
    noticed:       boolean;
    latest_job_id: string;
}

export interface RecoveryTime {
    Day:     number;
    Hour:    number;
    Minute:  number;
    Second:  number;
    reached: boolean;
}