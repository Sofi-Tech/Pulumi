/* eslint-disable no-multi-str */
export const tagsCliCMD =
  'aws dynamodb create-table \
  --table-name tags \
  --attribute-definitions \
      AttributeName=postID,AttributeType=S \
      AttributeName=tag,AttributeType=S \
  --key-schema \
      AttributeName=tag,KeyType=HASH \
      AttributeName=postID,KeyType=RANGE \
  --global-secondary-indexes \
      IndexName=postID,KeySchema=["{AttributeName=postID,KeyType=HASH}"],Projection={ProjectionType=ALL},ProvisionedThroughput={"ReadCapacityUnits=400,WriteCapacityUnits=400"} \
      IndexName=tag-index,KeySchema=["{AttributeName=tag,KeyType=HASH}"],Projection={ProjectionType=ALL},ProvisionedThroughput={"ReadCapacityUnits=400,WriteCapacityUnits=400"} \
  --billing-mode PAY_PER_REQUEST \
  --tags Key=Name,Value=tags --endpoint-url http://localhost:8000';

export const usersCliCMD =
  'aws dynamodb create-table \
--table-name users \
--attribute-definitions \
    AttributeName=email,AttributeType=S \
    AttributeName=userID,AttributeType=S \
--key-schema \
    AttributeName=email,KeyType=HASH \
--global-secondary-indexes \
    IndexName=userID,KeySchema=["{AttributeName=userID,KeyType=HASH}"],Projection={ProjectionType=ALL},ProvisionedThroughput={"ReadCapacityUnits=400,WriteCapacityUnits=400"} \
--billing-mode PAY_PER_REQUEST \
--tags Key=Name,Value=users --endpoint-url http://localhost:8000';

export const postsCliCMD =
  'aws dynamodb create-table \
--table-name posts \
--attribute-definitions \
    AttributeName=postID,AttributeType=S \
    AttributeName=userID,AttributeType=S \
--key-schema \
    AttributeName=userID,KeyType=HASH \
    AttributeName=postID,KeyType=RANGE \
--global-secondary-indexes \
    IndexName=postID,KeySchema=["{AttributeName=postID,KeyType=HASH}"],Projection={ProjectionType=ALL},ProvisionedThroughput={"ReadCapacityUnits=400,WriteCapacityUnits=400"} \
--billing-mode PAY_PER_REQUEST \
--tags Key=Name,Value=posts --endpoint-url http://localhost:8000';
