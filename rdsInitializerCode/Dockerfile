FROM amazon/aws-lambda-nodejs:20
WORKDIR ${LAMBDA_TASK_ROOT}

COPY package.json rds-cert.pem ./

COPY dist/ dist/

RUN npm install --omit=dev

CMD ["dist/index.handler"]
