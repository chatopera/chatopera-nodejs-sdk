declare interface ResponseResult {
  rc: number;
  data: any;
  error: string;
  msg: string;
  status: any;
}

declare class Chatbot {
  constructor(
    clientId: string,
    clientSecret: string,
    host: string = "https://bot.cskefu.com"
  );

  /**
   * 核心封装
   */
  command(method: string, path: string, payload: any): Promise<ResponseResult>;

  /**
   * 获得详情
   */
  detail(): Promise<ResponseResult>;

  /**
   * 检索知识库
   * @param userId
   * @param textMessage
   */
  faq(userId: string, textMessage: string): Promise<ResponseResult>;

  /**
   * 查询多轮对话
   * @param serId
   * @param textMessage
   * @param isDebug
   */
  conversation(
    serId: string,
    textMessage: string,
    isDebug: boolean = false
  ): Promise<ResponseResult>;

  /**
   * 查询用户列表
   * @param limit
   * @param page
   * @param sortby
   */
  users(
    limit: number = 50,
    page: number = 1,
    sortby: string = "-lasttime"
  ): Promise<ResponseResult>;

  /**
   * 获得聊天历史记录
   * @param userId
   * @param limit
   * @param page
   */
  chats(
    userId: string,
    limit: number = 50,
    page: number = 1
  ): Promise<ResponseResult>;

  /**
   * 屏蔽一个聊天者
   * @param userId
   */
  mute(userId: string): Promise<ResponseResult>;

  /**
   * 取消屏蔽一个聊天者
   * @param userId
   */
  unmute(userId: string): Promise<ResponseResult>;

  /**
   * 获取聊天者屏蔽状态
   * @param userId
   */
  ismute(userId: string): Promise<ResponseResult>;

  /**
   * 导入对话应用
   * @param botarchive 文件路径
   */
  deployConversation(botarchive: string): Promise<ResponseResult>;

  /**
   * 创建意图session
   * @param uid
   * @param channel
   */
  intentSession(uid: string, channel: string): Promise<ResponseResult>;

  /**
   * 获取意图session详情
   * @param sessionId
   */
  intentSessionDetail(sessionId: string): Promise<ResponseResult>;

  /**
   * 意图对话
   * @param sessionId
   * @param uid
   * @param textMessage
   */
  intentChat(
    sessionId: string,
    uid: string,
    textMessage: string
  ): Promise<IntentChatResult>;
}

export = { Chatbot };
