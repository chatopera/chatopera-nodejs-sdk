declare interface DetailResult {
  name: string;
  fallback: string;
  description: string;
  welcome: string;
  primaryLanguage: string;
}

declare interface FAQResult {
  id: string;
  score: number;
  post: string;
  reply: string;
}

declare interface ConversationService {
  provider: string;
}

declare interface ConversationResult {
  state: string;
  createdAt: number;
  string: string;
  topicName: string;
  subReplies: string[];
  service: ConversationService;
  logic_is_fallback: boolean;
  logic_is_unexpected: boolean;
  botName: string;
  faq: FAQResult[];
}

declare interface UserResult {
  userId: string;
  lasttime: string;
  created: string;
}

declare interface ChatResult {
  userId: string;
  textMessage: string;
  direction: string;
  service: string;
  created: string;
}

declare interface IsMuteResult {
  mute: boolean;
}
declare interface DeployConversationResult {
  msg: string;
}

declare interface IntentSlot {
  dictname: string;
  name: string;
  requires: boolean;
  val: string;
}

declare interface IntentSessionResult {
  channel: string;
  createdate: string;
  id: string;
  entities: IntentSlot[];
  intent_name: string;
  resolved: boolean;
  uid: string;
}

declare interface IntentMessage {
  receiver: string;
  is_proactive: boolean;
  is_fallback: boolean;
  textMessage: string;
}

declare interface IntentChatResult {
  message: IntentMessage;
  session: IntentSessionResult;
}

declare class Chatbot {
  constructor(
    clientId: string,
    clientSecret: string,
    host: string = 'https://bot.chatopera.com'
  );

  /**
   * 获得详情
   */
  detail(): Promise<DetailResult>;

  /**
   * 检索知识库
   * @param userId
   * @param textMessage
   */
  faq(userId: string, textMessage: string): Promise<FAQResult[]>;

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
  ): Promise<ConversationResult>;

  /**
   * 查询用户列表
   * @param limit
   * @param page
   * @param sortby
   */
  users(
    limit: number = 50,
    page: number = 1,
    sortby: string = '-lasttime'
  ): Promise<UserResult[]>;

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
  ): Promise<ChatResult[]>;

  /**
   * 屏蔽一个聊天者
   * @param userId
   */
  mute(userId: string): Promise<void>;

  /**
   * 取消屏蔽一个聊天者
   * @param userId
   */
  unmute(userId: string): Promise<void>;

  /**
   * 获取聊天者屏蔽状态
   * @param userId
   */
  ismute(userId: string): Promise<IsMuteResult>;

  /**
   * 导入对话应用
   * @param botarchive 文件路径
   */
  deployConversation(botarchive: string): Promise<DeployConversationResult>;

  /**
   * 创建意图session
   * @param uid
   * @param channel
   */
  intentSession(uid: string, channel: string): Promise<IntentSessionResult>;

  /**
   * 获取意图session详情
   * @param sessionId
   */
  intentSessionDetail(sessionId: string): Promise<IntentSessionResult>;

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

export = Chatbot;
