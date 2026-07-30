/**
 * Conversations Related Errors
 * @param {*} message 
 */
// 多轮对话导出错误
function ConversationExportError(message) {
    this.message = message;
    // Use V8's native method
    Error.captureStackTrace(this, ConversationExportError);
}

ConversationExportError.prototype = Object.create(Error.prototype);
ConversationExportError.prototype.name =
    "ConversationExportError";
ConversationExportError.prototype.constructor =
    ConversationExportError;

// 多轮对话导入错误
function ConversationImportError(message) {
    this.message = message;
    // Use V8's native method
    Error.captureStackTrace(this, ConversationImportError);
}

ConversationImportError.prototype = Object.create(Error.prototype);
ConversationImportError.prototype.name =
    "ConversationImportError";
ConversationImportError.prototype.constructor =
    ConversationExportError;


// SDK API General Error
function ChatoperaSDKGeneralError(message) {
    this.message = message;
    // Use V8's native method
    Error.captureStackTrace(this, ChatoperaSDKGeneralError);
}

ChatoperaSDKGeneralError.prototype = Object.create(Error.prototype);
ChatoperaSDKGeneralError.prototype.name =
    "ChatoperaSDKGeneralError";
ChatoperaSDKGeneralError.prototype.constructor =
    ConversationExportError;


module.exports = exports = {
    ConversationExportError,
    ConversationImportError,
    ChatoperaSDKGeneralError,
}