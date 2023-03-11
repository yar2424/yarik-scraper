import {
  ConditionalCheckFailedException,
  DynamoDBClient,
} from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

import { config } from "./config";

export const logProgress = async (
  progressPercentage: number,
  currentActivity: string
) => {
  const ddbClient = new DynamoDBClient({});
  const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);
  const updateExpression =
    "SET ProgressPercentage = :ProgressPercentage, CurrentActivity = :CurrentActivity";
  const expressionAttributeValues = {
    ":ProgressPercentage": progressPercentage,
    ":CurrentActivity": currentActivity,
  };
  const params = {
    TableName: "YarikScrapper",
    Key: {
      PK: config.dynamodbProgressItemKey,
    },
    UpdateExpression: updateExpression,
    ExpressionAttributeValues: expressionAttributeValues,
  };
  await ddbDocClient.send(new UpdateCommand(params));
};

export const logRunStart = async () => {
  const ddbClient = new DynamoDBClient({});
  const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);
  const startDateTimeString = new Date().toISOString();
  const updateExpression = "SET StartedAt = :StartedAt, Running = :True";
  const conditionalExpression = "Running <> :True";
  const expressionAttributeValues = {
    ":StartedAt": startDateTimeString,
    ":True": true,
  };
  const params = {
    TableName: "YarikScrapper",
    Key: {
      PK: config.dynamodbProgressItemKey,
    },
    UpdateExpression: updateExpression,
    ConditionExpression: conditionalExpression,
    ExpressionAttributeValues: expressionAttributeValues,
  };
  await ddbDocClient.send(new UpdateCommand(params));
};

export const logRunEnd = async () => {
  const ddbClient = new DynamoDBClient({});
  const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);
  const finishDateTimeString = new Date().toISOString();
  const updateExpression = "SET FinishedAt = :FinishedAt, Running = :False";
  const expressionAttributeValues = {
    ":FinishedAt": finishDateTimeString,
    ":False": false,
  };
  const params = {
    TableName: "YarikScrapper",
    Key: {
      PK: config.dynamodbProgressItemKey,
    },
    UpdateExpression: updateExpression,
    ExpressionAttributeValues: expressionAttributeValues,
  };
  await ddbDocClient.send(new UpdateCommand(params));
};
