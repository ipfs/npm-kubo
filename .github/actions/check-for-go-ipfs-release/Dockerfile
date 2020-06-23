FROM node:10

LABEL "com.github.actions.name"="Update and publish"
LABEL "com.github.actions.description"="Publish new version when a new go-ipfs version is relased"
LABEL "com.github.actions.icon"="rss"
LABEL "com.github.actions.color"="green"

COPY entrypoint.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
