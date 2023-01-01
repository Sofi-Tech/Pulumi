import { sdk } from '@pulumi/aws';

// create dynamoDB client
export const dbClient = new sdk.DynamoDB.DocumentClient();
