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

## Предупреждение

**!!! ВНИМАНИЕ !!!**

Проект в ранней альфа-стадии! Возможны существенные изменения функционала при выходе новых версий, которые всё сломают. Внимательно читайте описания к новым версиям!

**Требуется помощь в написании документации.**

Проект представляет набор нод (узлов) Node-RED для работы с Алисой от Яндекса без сторонних сервисов, напрямую с домашнего сервера. С требованиями можно ознакомиться [здесь](#требования).

<img src="https://github.com/twocolors/node-red-contrib-alice-self-hosting/raw/master/readme/node-demo.png">

## Благодарности

Это большой copy-paste из двух замечательный проектов [node-red-contrib-alice](https://github.com/efa2000/node-red-contrib-alice) и [yandex2mqtt](https://github.com/lasthead0/yandex2mqtt).

Спасибо им за идею и реализацию.

## Принцип работы

Кроме нод для работы с Алисой, релизованных в других замечательных проектах, node-red-contrib-alice-self-hosting средствами самого Node-RED создает веб-сервер для авторизации и обработки команд.

В итоге для работы не требуется ничего кроме самого Node-RED и работоспособность не зависит ни от каких сторонных сервисов — только Яндекса и домашнего сервера, что также весьма положительно влияет на скорость работы.

# Безопасность

> The 'S' in IoT stands for Security

Нода **должна** быть спрятана за правильно настроенными сервисами типа nginx, traefik, caddy, ngrok, localtunnel, cloudflare и т.п., в противном случае любой может **получить полный доступ** к Node-RED. В случае, если доступ снаружи предоставлен ко всему Node-RED, необходимо добавить [авторизацию](https://nodered.org/docs/user-guide/runtime/securing-node-red#usernamepassword-based-authentication).

Существуют ноды для [ngrok](https://flows.nodered.org/node/node-red-contrib-ngrok) (на 21.12.2023 нода банит, ждем решения подробнее [issues/30](https://github.com/sammachin/node-red-contrib-ngrok/issues/30)) и [localtunnel](https://flows.nodered.org/node/node-red-contrib-localtunnel), которые позволяют получить доступ к установке Node-RED из интернета без проброса портов на роутере и установки дополнительного ПО. Самое простое решение — ngrok, так как помимо прочего даже в бесплатной версии позволяет автоматизировать получение TLS сертификата.

# Требования

Для работы требуется несколько обязательных условий:

## Белый IP-адрес

Если ваш роутер говорит что провайдер дал адрес из [этого диапазона](https://ru.wikipedia.org/wiki/Частный_IP-адрес) — он не белый.

Яндекс требует постоянного доступа к машине с Node-RED из внешнего интернета и сделать с этим ничего нельзя.

## Постоянный IP-адрес или собственный домен

Домен может быть бесплатным и любым, например от [Duck DNS](https://www.duckdns.org) или любых других сервисов.

Яндекс требует указать URL для ноды и если указать свой динамический IP, то после каждого переподключения к провайдеру потребуется заново настраивать навык Алисы.

## Валидный TLS сертификат

Который настроен для использования с Node-RED или обратным прокси-сервером. Бесплатный всегда можно получить у [LetsEncrypt](https://letsencrypt.org). Яндекс не позволяет использовать самоподписанные сертификаты.

## Открытый порт и маршрут

При домашнем использовании необходимо на роутере открыть порт и создать маршрут до сервера с Node-RED (Эта манипуляция известна как *проброс порта*).

Без этого Яндекс никак не сможет получить доступ к Node-RED.

# Установка

## Установка ноды

Обычная установка из палитры Node-RED. После установки перезапуск **обязателен**, как и после любого обновления.

<img src="https://github.com/twocolors/node-red-contrib-alice-self-hosting/raw/master/readme/node-install.png">

## Настройка доступа для Яндекса

Это самое сложное в настройке и индивидуально для каждого пользователя.

Концепция такова:

- домен `mydomain.ru` резолвит адрес домашнего роутера

- роутер настроен на т.н. пробрасывание порта (TCP) до машины с установленным Node-RED

    - настоятельнейше рекомендуется использовать обратный прокси-сервер (самый простой — Nginx Proxy Manager), при этом открыть доступ не к всему Node-RED, а только до определенного путм в нём — **WebHook URL** (см. ниже)

    - если используется авторизация (белые списки и т.п.), она должна быть отключена до **WebHook URL**, этот адрес **и те, что глубже него** должны быть полностью открыты. Например `https://mydomain.ru/0123abcdef/webhook` и все что дальше — `https://mydomain.ru/0123abcdef/webhook/anything/absulutely/completely/any/url`. Всё что выше: `https://mydomain.ru/0123abcdef/` или `https://mydomain.ru/` должно быть закрыто, это прямой доступ к админке Node-RED для любого пользователя интернета

- Node-RED создает **WebHook URL**, через который и происходит общение с Алисой

## Примеры настройки reverse proxy

Примеры настройки обратного прокси-сервера. Адрес сервера Node-RED `192.168.0.2`, порт `1880`, домен `alice.mydomain.ru` указывает на внешний IP-адрес (роутера), на роутере проброшен порт 443 (https) до сервера с traefik (тоже `192.168.0.2`).

### Traefik

Настройка для Traefik в файле:

```
http:
  routers:
    nodered-alice:
      entrypoints:
        - websecure
      rule: Host(`alice.mydomain.ru`) && PathPrefix(`/0123abcdef/webhook`)
      service: nodered-alice
      tls: true

services:
    nodered-alice:
      loadBalancer:
        servers:
        - url: "http://192.168.0.2:1880"
```

Настройка для Traefik через labels:

```
labels:
      - "traefik.enable=true"
      - "traefik.http.routers.nodered-alice.rule=Host(`alice.mydomain.ru`) && PathPrefix(`/0123abcdef/webhook`)"
      - "traefik.http.routers.nodered-alice.entrypoints=websecure"
      - "traefik.http.routers.nodered-alice.tls.certResolver=letsencrypt"
      - "traefik.http.services.nodered-alice.loadbalancer.server.port=1880"
```

### Nginx proxy manager

**TBD**

### Caddy

**TBD**

## Получение WebHook URL

После перезапуска перетаскиваем любую ноду на сетку и в свойствах нового узла (Credentials) запоминаем адрес (**WebHook URL**) из примечания (вида `http://192.168.0.2:1880/0123abcdef/webhook`). Это тот самый адрес который должен быть доступен из интернета для Яндекса.

Для большей гибкости и в случае отсутствия reverse proxy **настоятельно рекомендуется** изменить порт на отличный от стандартного порта Node-RED (1880). Часть URL вида `0123abcdef` генерируется случайно для каждого пользователя, её тоже можно изменить если в одной инсталяции Node-RED используется несколько аккаунтов Яндекса (например несколько "домов").

Реализация oauth использует сервис [Яндекс](https://oauth.yandex.ru) подробнее на [Хабре](https://habr.com/ru/amp/publications/710366/)

## Создание OAuth

- [Здесь](https://oauth.yandex.ru) создаем новое приложение.

    - *Для каких платформ нужно приложение* — Веб-сервисы

    - *Доступ к данным* — что угодно, можно оставить только "Доступ к портрету пользователя"

    - *Redirect URI* — `https://social.yandex.net/broker/redirect`

    - *Почта для связи* — почта для связи

- Сохраняем **ClientID** и **Client secret**

<img src="https://github.com/twocolors/node-red-contrib-alice-self-hosting/raw/master/readme/oauth.png">


- Создаем **Приватный** диалог на [Яндекс](https://dialogs.yandex.ru)

    - *Тип диалога* — Умный дом

    - *Название* — любое

    - *Backend* — *Endpoint URL* — адрес из ноды (**WebHook URL**)

    - *Тип доступа* — Приватный

    - Остальные поля со звездочкой — на свой вкус

    - В разделе *Связка аккаунтов*

        - *Идентификатор приложения* — ранее полученный **ClientID**

        - *Секрет приложения* — ранее полученный **Client secret**

        - *URL авторизации* — `https://oauth.yandex.ru/authorize`

        - *URL для получения токена* — `https://oauth.yandex.ru/token`

        - *URL для обновления токена* — `https://oauth.yandex.ru/token`

<img src="https://github.com/twocolors/node-red-contrib-alice-self-hosting/raw/master/readme/dialogs.png">

## Настройки ноды

**TBD**

# Настройка сети

Сервер с Node-RED или с reverse proxy должны быть доступны из интернета.

Для этого на роутере следует разрешить

## OpenWRT

**TBD**

## Keenetic

Настройки — Сетевые правила — Переадресация — Правила переадресации портов — Добавить правило

Выход: *Выбрать из списка устройств сервер с Node-RED или reverse proxy*

Открыть порт: *Порт, к которому будет открыт доступ извне, рекомендуется использовать случайный из диапазона 40000-50000, но можно использовать и стандартный 443 (https)*

Порт назначения: *Порт Node-RED (1880) или порт, который слушает reverse proxy*

## TP-Link

**TBD**

# Использование

## Создание устройства

**TBD**

<details>
  <summary>Примеры</summary>

## Примеры

### on_off

### toggle

### range

### color

### mode

### sensor

</details>
