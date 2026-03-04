declare module "web-push" {
  interface Keys {
    p256dh: string;
    auth: string;
  }

  interface PushSubscription {
    endpoint: string;
    keys: Keys;
  }

  interface SendResult {
    statusCode: number;
    body: string;
    headers: Record<string, string>;
  }

  function setVapidDetails(subject: string, publicKey: string, privateKey: string): void;
  function sendNotification(subscription: PushSubscription, payload: string): Promise<SendResult>;

  export { Keys, PushSubscription, SendResult };
  export default { setVapidDetails, sendNotification };
}
