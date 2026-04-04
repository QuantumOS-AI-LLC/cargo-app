export async function sendWebhook(action: string, data: any) {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn("N8N_WEBHOOK_URL is not set. Webhook will not be sent.");
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action,
        data,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      console.warn(`Webhook for action ${action} returned status: ${response.status}`);
    }
  } catch (error) {
    console.error(`Failed to send webhook for action ${action}:`, error);
  }
}
