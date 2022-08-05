FROM node:18.7.0 as builder

WORKDIR /app
COPY . .
RUN npm install && npm install -g vsce && mkdir -p out
CMD [ "vsce",  "package", "--out",  "./out" ]
