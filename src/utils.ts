export const tapError = <T>(t: T) => (console.error(t), t);
export const prettyLog = (value: any) =>
  console.log(JSON.stringify(value, undefined, 4));
