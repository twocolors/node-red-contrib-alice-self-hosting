# node-red-contrib-alice-self-hosting

[![platform](https://img.shields.io/badge/platform-Node--RED-red?logo=nodered)](https://flows.nodered.org/node/node-red-contrib-alice-self-hosting)
[![Min Node Version](https://img.shields.io/node/v/node-red-contrib-alice-self-hosting.svg)](https://nodejs.org/en/)
[![GitHub version](https://img.shields.io/github/package-json/v/twocolors/node-red-contrib-alice-self-hosting?logo=npm)](https://www.npmjs.com/package/node-red-contrib-alice-self-hosting)
[![GitHub stars](https://img.shields.io/github/stars/twocolors/node-red-contrib-alice-self-hosting)](https://github.com/twocolors/node-red-contrib-alice-self-hosting/stargazers)
[![Package Quality](https://packagequality.com/shield/node-red-contrib-alice-self-hosting.svg)](https://packagequality.com/#?package=node-red-contrib-alice-self-hosting)

[![issues](https://img.shields.io/github/issues/twocolors/node-red-contrib-alice-self-hosting?logo=github)](https://github.com/twocolors/node-red-contrib-alice-self-hosting/issues)
![GitHub last commit](https://img.shields.io/github/last-commit/twocolors/node-red-contrib-alice-self-hosting)
![NPM Total Downloads](https://img.shields.io/npm/dt/node-red-contrib-alice-self-hosting.svg)
![NPM Downloads per month](https://img.shields.io/npm/dm/node-red-contrib-alice-self-hosting)
![Repo size](https://img.shields.io/github/repo-size/twocolors/node-red-contrib-alice-self-hosting)

## About

### !!! Alpha, Alpha, Alpha release !!!
### !!! Нужна помощь в написании документации / Need help writing documentation !!!

Node-RED nodes to Yandex Alice devices in Self-Hosting

Это большой copy-paste из двух замечательный проектов [node-red-contrib-alice](https://github.com/efa2000/node-red-contrib-alice) и [yandex2mqtt](https://github.com/lasthead0/yandex2mqtt)

Спасибо им за реализацию

## Security

Этот юзел должен быть спрятана за сервисам nginx, ngrok, cloudflare и т.д., есть риск **получить полный доступ** к Node-RED

## Install

Реализация oauth использует сервис [Яндекс](https://oauth.yandex.ru) подробнее на [Хабре](https://habr.com/ru/amp/publications/710366/)

Создаем oauth на https://oauth.yandex.ru , сохраням **ClientID** и **Client secret** заполняем **Redirect URI для веб-сервисов** (https://social.yandex.net/broker/redirect) все как на скрине

<img src="https://github.com/twocolors/node-red-contrib-alice-self-hosting/raw/master/readme/oauth.png">

Создаем диалог на [Яндекс](https://dialogs.yandex.ru) заполняем **ClientID** и **Client secret** как на скрине

<img src="https://github.com/twocolors/node-red-contrib-alice-self-hosting/raw/master/readme/dialogs.png">
