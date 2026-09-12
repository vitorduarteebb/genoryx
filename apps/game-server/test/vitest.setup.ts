const send = process.send?.bind(process);
if (send) {
  process.send = ((message: unknown, ...rest: unknown[]) => {
    if (
      message &&
      typeof message === "object" &&
      "type" in message &&
      typeof (message as { type: unknown }).type === "string" &&
      (message as { type: string }).type.startsWith("axm:")
    ) {
      return true;
    }
    return send(message, ...(rest as []));
  }) as typeof process.send;
}
