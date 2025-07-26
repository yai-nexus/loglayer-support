declare module '@alicloud/log' {
  interface Client {
    new(config: any): any;
    postLogStoreLogs(project: string, logstore: string, logGroup: any): Promise<any>;
  }
  const Client: {
    new(config: any): any;
  };
  export default Client;
} 