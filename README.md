# zenty helper backend
> github template repository for creating local-first ai backends for zenty helper.
backend infrastructure for zenty helper — a local-first ai assistant for figma focused on design intelligence and skill analysis.
---
# english
## overview
zenty helper backend is a github template repository for building local-first ai backends for zenty helper.
strapi powers the plugin auth flow and stores plugin-specific github identity data.
this backend can be used for:
- plugin auth
- github oauth
- plugin identity
- question memory
- global memory
- local-first ai workflows
- ollama integrations
---
## what is it?
zenty helper backend is a strapi-based backend used by zenty helper, a local-first ai assistant for figma.
zenty helper analyzes:
- figma data
- design structure
- visual decisions
- skill patterns
ai inference can run locally through ollama.
this backend stores:
- plugin identity
- user sessions
- question memory
- global memory
---
## stack
- [strapi](https://strapi.io/)
- [sqlite](https://www.sqlite.org/)
- [github oauth](https://docs.github.com/en/apps/oauth-apps)
- [ollama](https://ollama.com/)
- [figma plugin api](https://www.figma.com/plugin-docs/)
---
## requirements
install before setup:
- [node.js 20+](https://nodejs.org/)
- [npm](https://www.npmjs.com/)
- [git](https://git-scm.com/)
- [ollama](https://ollama.com/)
---
# use this template
click:
> Use this template
on the github repository page to generate your own backend repository.
this template already includes:
- strapi setup
- sqlite configuration
- github oauth structure
- plugin identity collections
- question memory collections
- local-first ai environment setup
---
## installation
### clone repository:
``
git clone https://github.com/Zenty-AI/Zenty-Figma-Backend.git
``
### open project folder:
``
cd Zenty-Figma-Backend
``
### install dependencies:
``
npm install
``

### environment variables
before running the backend, copy .env.example into .env:
``
cp .env.example .env
``
> then edit .env and replace placeholder values.

# project structure:
Zenty-Figma-Backend/
├── package.json
├── .env
├── src/
└── config/

# github oauth setup

## create github oauth app:

### open github developer settings:
https://github.com/settings/developers

### go to:
OAuth Apps
> then click:
``
New OAuth App
``

### fill the application form:

Application name:
> Zenty Helper Local

Homepage URL:
> http://localhost:strapiPort

Application description:
> Local OAuth app for Zenty Helper Figma Plugin

Authorization callback URL:
> http://localhost:strapiPort/api/plugin-auth/github/callback

##### use this callback because zenty helper uses a custom plugin auth flow instead of the default strapi oauth provider endpoints.

# after creating the application, github will provide:

> Client ID
> Client Secret
## generate a new client secret and copy both values into `.env`:
```
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
PUBLIC_SERVER_URL=http://localhost:1337
```

# ollama setup

## install ollama:

``
ollama download￼
``

## install model 
#### i can recomend this models:
##### lightwheight models:
- `qwen2.5:7b`
- `qwen2.5vl`
- `gemma3`
- `gemma3:12b`
- `llava`

## run model:
``
ollama run gemma3
``
local endpoint:

http://localhost:11434

add into .env:

OLLAMA_URL=http://localhost:11434

⸻

local development

recommended safe watcher mode:

npm run dev

this mode enables polling and disables admin hot-watch to avoid:

* EMFILE
* watch-admin

errors during local development.

for figma desktop development, bind strapi to :: in .env.

supported local hosts:

* localhost
* 127.0.0.1
* ::1

if you want the default watcher flow:

npm run dev:fast

⸻

plugin auth endpoints

POST /api/plugin-auth/github/start
GET  /api/plugin-auth/github/status?state=...
GET  /api/plugin-auth/github/callback
GET  /api/plugin-auth/me

plugin auth flow:

* existing github email → linked to existing user
* new github email → automatically creates new users-permissions user

⸻

run development server

npm run develop

strapi admin panel:

http://localhost:1337/admin

api base url:

http://localhost:1337/api

⸻

production

build admin panel:

npm run build

start production server:

npm run start

⸻

current data models

* plugin auth session
* plugin identity
* plugin question global memory
* plugin question memory
* user

⸻

philosophy

zenty helper is built around:

* local-first workflows
* privacy
* human-centered ai
* intelligent design feedback

the goal is not to replace designers.

the goal is to amplify design thinking.

⸻

русский

обзор

zenty helper backend — это github template repository для создания local-first ai backend-инфраструктуры для zenty helper.

strapi используется для plugin auth flow и хранения github identity данных плагина.

backend используется для:

* plugin auth
* github oauth
* plugin identity
* question memory
* global memory
* local-first ai workflows
* ollama integrations

⸻

что это?

zenty helper backend — это backend на strapi для zenty helper, local-first ai ассистента для figma.

zenty helper анализирует:

* данные figma
* структуру дизайна
* визуальные решения
* паттерны навыков

ai может работать локально через ollama.

backend хранит:

* plugin identity
* user sessions
* question memory
* global memory

⸻

стек

* strapi￼
* sqlite￼
* github oauth￼
* ollama￼
* figma plugin api￼

⸻

требования

перед установкой нужны:

* node.js 20+￼
* npm￼
* git￼
* ollama￼

⸻

использование шаблона

на странице github-репозитория нажми:

Use this template

чтобы создать свой backend на основе шаблона.

в шаблоне уже настроены:

* strapi
* sqlite
* github oauth
* plugin identity collections
* question memory collections
* local-first ai environment setup

⸻

установка

клонируй репозиторий:

git clone https://github.com/Zenty-AI/Zenty-Figma-Backend.git

открой папку проекта:

cd Zenty-Figma-Backend

установи зависимости:

npm install

⸻

файл .env

перед запуском backend скопируй .env.example в .env:

cp .env.example .env

после этого открой .env и замени placeholder значения.

структура проекта:

Zenty-Figma-Backend/
├── package.json
├── .env
├── src/
└── config/

⸻

пример .env

HOST=0.0.0.0
PORT=1337
APP_KEYS=change_me_1,change_me_2,change_me_3,change_me_4
API_TOKEN_SALT=change_me
ADMIN_JWT_SECRET=change_me
TRANSFER_TOKEN_SALT=change_me
JWT_SECRET=change_me
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
PUBLIC_SERVER_URL=http://localhost:1337
OLLAMA_URL=http://localhost:11434

для production замени все change_me на случайные секреты.

генерация секрета:

openssl rand -base64 32

⸻

настройка github oauth

создай github oauth app:

github developer settings￼

callback url:

http://localhost:1337/api/plugin-auth/github/callback

после этого вставь client id и client secret в .env:

GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret

⸻

настройка ollama

установи ollama:

ollama download￼

запусти модель:

ollama run gemma3

локальный endpoint:

http://localhost:11434

добавь endpoint в .env:

OLLAMA_URL=http://localhost:11434

⸻

локальная разработка

рекомендуемый безопасный watcher mode:

npm run dev

этот режим включает polling и отключает admin hot-watch для предотвращения:

* EMFILE
* watch-admin

ошибок во время локальной разработки.

для figma desktop plugin рекомендуется использовать :: в .env.

поддерживаются:

* localhost
* 127.0.0.1
* ::1

если нужен стандартный watcher flow:

npm run dev:fast

⸻

plugin auth endpoints

POST /api/plugin-auth/github/start
GET  /api/plugin-auth/github/status?state=...
GET  /api/plugin-auth/github/callback
GET  /api/plugin-auth/me

логика auth flow:

* существующий github email → привязывается к существующему пользователю
* новый github email → автоматически создаётся новый users-permissions user

⸻

запуск backend

npm run develop

strapi admin panel:

http://localhost:1337/admin

api base url:

http://localhost:1337/api

⸻

production

сборка admin panel:

npm run build

запуск production server:

npm run start

⸻

текущие модели данных

* plugin auth session
* plugin identity
* plugin question global memory
* plugin question memory
* user

⸻

философия

zenty helper строится вокруг:

* local-first подхода
* приватности
* human-centered ai
* intelligent design feedback

цель — не заменить дизайнеров.

цель — усилить дизайнерское мышление.

⸻

license

private infrastructure.

all rights reserved.
