FROM node:14

LABEL "com.github.actions.name"="Version and publish"
LABEL "com.github.actions.description"="npm version and publish with new kubo version"
LABEL "com.github.actions.icon"="box"
LABEL "com.github.actions.color"="green"

COPY entrypoint.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
