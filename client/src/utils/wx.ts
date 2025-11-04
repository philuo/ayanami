/** 开始录音 */
async function startRecord(): Promise<void> {
  if (!window.wx) {
    throw new Error('微信SDK未初始化');
  }

  return new Promise((resolve, reject) => {
    window.wx.startRecord({
      success: () => {
        resolve();
      },
      fail: (error: any) => {
        console.error('❌ [录音API] 开始录音失败:', error);
        reject(error);
      },
    });
  });
}

/** 停止录音 */
async function stopRecord(): Promise<{ localId: string }> {
  if (!window.wx) {
    throw new Error('微信SDK未初始化');
  }

  return new Promise((resolve, reject) => {
    window.wx.stopRecord({
      success: (res: any) => {
        resolve(res);
      },
      fail: (error: any) => {
        console.error('❌ [录音API] 停止录音失败:', error);
        reject(error);
      },
    });
  });
}

/** 监听录音自动停止 */
async function onVoiceRecordEnd(callback: (res: { localId: string }) => void) {
  if (!window.wx) return;

  window.wx.onVoiceRecordEnd(callback);
}

/** 语音转文字 */
async function translateVoice(localId: string): Promise<{ translateResult: string }> {
  if (!window.wx) {
    throw new Error('微信SDK未初始化');
  }

  return new Promise((resolve, reject) => {
    window.wx.translateVoice({
      localId,
      isShowProgressTips: 1,
      success: (res: any) => {
        resolve(res);
      },
      fail: (error: any) => {
        console.error('❌ [语音转文字] 语音转文字失败:', error);
        reject(error);
      },
    });
  });
}

export default {
  /** 开始录音 */
  startRecord,
  /** 停止录音 */
  stopRecord,
  /** 监听录音自动停止 */
  onVoiceRecordEnd,
  /** 语音转文字 */
  translateVoice
};
