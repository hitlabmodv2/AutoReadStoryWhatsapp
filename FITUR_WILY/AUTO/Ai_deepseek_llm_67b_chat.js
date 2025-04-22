// Function to handle Deepseek Chat responses
async function handleDeepseekChat(text, senderName, config) {
  // Check if autoaiv1 is enabled in config
  if (!config.autoaiv1) {
    return null;
  }

  try {
    // Add language instruction to the prompt
    const languageInstruction = "Please detect the language of the input and respond in the same language. For example, if the input is in Indonesian, respond in Indonesian. If the input is in English, respond in English.";
    const prompt = `${languageInstruction}\n\nUser: ${text}`;

    const response = await fetch(`https://api.siputzx.my.id/api/ai/deepseek-llm-67b-chat?content=${encodeURIComponent(prompt)}`);
    const data = await response.json();

    if (data.status && data.data) {
      return data.data;
    }
    return "Maaf, saya tidak dapat memproses permintaan Anda saat ini. / Sorry, I cannot process your request at this time.";
  } catch (error) {
    console.error("Deepseek chat error:", error);
    return "Terjadi kesalahan saat memproses permintaan. Silakan coba lagi dalam beberapa saat. / An error occurred while processing the request. Please try again later.";
  }
}

export default handleDeepseekChat;