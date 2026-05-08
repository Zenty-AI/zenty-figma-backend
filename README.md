# lune helper backend
> github template repository for creating local-first ai backends for lune helper.
backend infrastructure for lune helper — a local-first ai assistant for figma focused on design intelligence and skill analysis.
---
## overview
lune helper backend is a github template repository for building local-first ai backends for lune helper.
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
lune helper backend is a strapi-based backend used by lune helper, a local-first ai assistant for figma.
lune helper analyzes:
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
git clone https://github.com/Lune-AI/Lune-Figma-Backend.git
``
### open project folder:
``
cd Lune-Figma-Backend
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
Lune-Figma-Backend:

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
> Lune Helper Local

Homepage URL:
> http://localhost:strapiPort

Application description:
> Local OAuth app for Lune Helper Figma Plugin

Authorization callback URL:
> http://localhost:strapiPort/api/plugin-auth/github/callback

##### use this callback because lune helper uses a custom plugin auth flow instead of the default strapi oauth provider endpoints.

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

##### heavyweight models:
- `qwen2.5:32b`
- `qwen2.5vl:32b`
- `llama3.3:70b`
- `deepseek-r1:32b`
- `mixtral:8x7b`

## run model:
``
ollama run `model name`
``
### local endpoint:
http://localhost:ollamaPort

### add into .env:
OLLAMA_URL=http://localhost:ollamaPort

# plugin auth endpoints
``
POST /api/plugin-auth/github/start
``
``
GET  /api/plugin-auth/github/status?state=...
``
``
GET  /api/plugin-auth/github/callback
``
``
GET  /api/plugin-auth/me
``

## plugin auth flow:

* existing github email → linked to existing user
* new github email → automatically creates new users-permissions user

# production

## build admin panel:
``
npm run build
``
## start  server:
``
npm run start
``

# current data models

* plugin auth session
* plugin identity
* plugin question global memory
* plugin question memory
* user

⸻

###### philosophy
###### lune helper is built around:
###### * local-first workflows
###### * privacy
###### * human-centered ai
###### * intelligent design feedback

##### the goal is not to replace designers.
### the goal is to amplify design thinking.
