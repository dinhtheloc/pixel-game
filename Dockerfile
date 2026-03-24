FROM node:22.14 as builder

RUN mkdir /src

WORKDIR /src

ADD package.json package.json



# copy ingredients
ADD public public
ADD src src
ADD index.html index.html
ADD eslint.config.js eslint.config.js
ADD tsconfig.json tsconfig.json
ADD tsconfig.app.json tsconfig.app.json
ADD tsconfig.node.json tsconfig.node.json
ADD vite.config.ts vite.config.ts
ADD .env .env
ADD components.json components.json

# cook ingredients
RUN npm install
RUN npm run build

# serve the dishes
FROM nginx:1.25.3-alpine3.18 as runner

ADD default.conf /etc/nginx/conf.d/

RUN mkdir -p /usr/share/nginx/html/mango-portal

COPY --from=builder /src/dist/ /usr/share/nginx/html/mango-portal/
