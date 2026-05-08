'use strict';

const crypto = require('crypto');
const { errors } = require('@strapi/utils');

const {
  ApplicationError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
  ForbiddenError,
} = errors;

const AUTH_SESSION_UID = 'api::plugin-auth-session.plugin-auth-session';
const IDENTITY_UID = 'api::plugin-identity.plugin-identity';
const USER_UID = 'plugin::users-permissions.user';
const ROLE_UID = 'plugin::users-permissions.role';

module.exports = ({ strapi }) => {
  const escapeHtml = (value) =>
    String(value)
      .replace(/&/gu, '&amp;')
      .replace(/</gu, '&lt;')
      .replace(/>/gu, '&gt;')
      .replace(/"/gu, '&quot;')
      .replace(/'/gu, '&#39;');

  const getPluginAuthConfig = () => {
    const config = strapi.config.get('plugin::users-permissions.pluginAuth', {});

    if (!config.githubClientId || !config.githubClientSecret) {
      throw new ApplicationError('GitHub auth is not configured on the server.');
    }

    return config;
  };

  const getCallbackUrl = (config) => {
    return new URL(config.githubCallbackPath, config.publicServerUrl).toString();
  };

  const formatUser = (user, identity) => {
    return {
      id: user.id,
      name: identity?.name || null,
      username: user.username,
      email: user.email,
      avatarUrl: identity?.avatarUrl || null,
      provider: identity?.provider || user.provider || 'github',
    };
  };

  const renderCallbackPage = (locale, { title, message, helper, variant = 'success' }) => {
    const isSuccess = variant === 'success';
    const pageTitle = locale === 'en' ? 'GitHub sign-in' : 'Вход через GitHub';
    const glowColor = isSuccess ? '#0090ff' : '#ff5353';
    const glowShadow = isSuccess
      ? 'rgba(0, 144, 255, 0.48)'
      : 'rgba(255, 83, 83, 0.4)';
    const glowMarkup = isSuccess
      ? `
        <svg class="glow-svg" viewBox="0 0 1000 1000" aria-hidden="true">
          <defs>
            <filter id="glow-bloom" x="-40%" y="-40%" width="180%" height="180%" color-interpolation-filters="sRGB">
              <feGaussianBlur stdDeviation="118" />
            </filter>
            <filter id="glow-soft" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB">
              <feGaussianBlur stdDeviation="76" />
            </filter>
          </defs>
          <polygon
            points="500,92 610,314 842,176 748,430 930,500 748,570 842,824 610,686 500,908 390,686 158,824 252,570 70,500 252,430 158,176 390,314"
            fill="${glowColor}"
            opacity="0.42"
            filter="url(#glow-bloom)"
          />
          <polygon
            points="500,92 610,314 842,176 748,430 930,500 748,570 842,824 610,686 500,908 390,686 158,824 252,570 70,500 252,430 158,176 390,314"
            fill="${glowColor}"
            opacity="0.9"
            filter="url(#glow-soft)"
          />
        </svg>`
      : `
        <svg class="glow-svg" viewBox="0 0 1000 1000" aria-hidden="true">
          <defs>
            <filter id="glow-bloom" x="-40%" y="-40%" width="180%" height="180%" color-interpolation-filters="sRGB">
              <feGaussianBlur stdDeviation="108" />
            </filter>
            <filter id="glow-soft" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB">
              <feGaussianBlur stdDeviation="68" />
            </filter>
          </defs>
          <circle
            cx="500"
            cy="500"
            r="250"
            fill="${glowColor}"
            opacity="0.42"
            filter="url(#glow-bloom)"
          />
          <circle
            cx="500"
            cy="500"
            r="250"
            fill="${glowColor}"
            opacity="0.9"
            filter="url(#glow-soft)"
          />
        </svg>`;

    return `<!DOCTYPE html>
<html lang="${locale}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${pageTitle}</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        background: #ffffff;
        font-family: Arial, Helvetica, sans-serif;
      }
      .glow-wrap {
        position: absolute;
        inset: 50% auto auto 50%;
        width: min(82vw, 1180px);
        aspect-ratio: 1 / 1;
        transform: translate(-50%, -50%);
      }
      .glow-svg {
        display: block;
        width: 100%;
        height: 100%;
        overflow: visible;
      }
      .glow-aura {
        position: absolute;
        inset: 50% auto auto 50%;
        width: min(84vw, 1080px);
        aspect-ratio: 1 / 1;
        transform: translate(-50%, -50%);
        border-radius: 999px;
        background: radial-gradient(circle, ${glowShadow} 0%, rgba(255, 255, 255, 0) 68%);
        filter: blur(${isSuccess ? '98px' : '72px'});
        opacity: ${isSuccess ? '0.72' : '0.58'};
      }
      .grain {
        position: absolute;
        inset: 0;
        background-image:
          radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
          radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px);
        background-position: 0 0, 12px 12px;
        background-size: 24px 24px;
        mix-blend-mode: overlay;
        opacity: 0.18;
        pointer-events: none;
      }
      .content {
        position: relative;
        z-index: 1;
        width: min(760px, calc(100vw - 48px));
        text-align: center;
        color: #ffffff;
      }
      h1 {
        margin: 0;
        font-size: clamp(56px, 8vw, 104px);
        line-height: 0.95;
        letter-spacing: -0.08em;
        font-family: Arial Black, Arial, Helvetica, sans-serif;
      }
      .message {
        margin-top: 22px;
        font-size: clamp(24px, 3vw, 50px);
        line-height: 1.14;
        letter-spacing: -0.05em;
      }
      .helper {
        margin-top: 18px;
        font-size: clamp(16px, 1.7vw, 26px);
        line-height: 1.35;
        letter-spacing: -0.03em;
        color: rgba(255, 255, 255, 0.92);
      }
      .helper small {
        display: block;
        margin-top: 6px;
        font-size: 0.78em;
        opacity: 0.92;
      }
    </style>
  </head>
  <body>
    <div class="glow-aura"></div>
    <div class="glow-wrap">${glowMarkup}</div>
    <div class="grain"></div>
    <div class="content">
      <h1>${escapeHtml(title)}</h1>
      <div class="message">${escapeHtml(message)}</div>
      <div class="helper">${helper}</div>
    </div>
  </body>
</html>`;
  };

  const normalizeLocale = (locale) => (locale === 'en' ? 'en' : 'ru');

  const markExpiredSession = async (session) => {
    await strapi.db.query(AUTH_SESSION_UID).update({
      where: { id: session.id },
      data: {
        status: 'expired',
        errorCode: 'session_expired',
        issuedJwt: null,
      },
    });
  };

  const ensureSessionIsActive = async (state) => {
    if (!state) {
      throw new ValidationError('Missing auth state.');
    }

    const session = await strapi.db.query(AUTH_SESSION_UID).findOne({
      where: { state },
      populate: ['user'],
    });

    if (!session) {
      throw new NotFoundError('Auth session was not found.');
    }

    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      await markExpiredSession(session);
      session.status = 'expired';
      session.errorCode = 'session_expired';
      session.issuedJwt = null;
    }

    return session;
  };

  const getDefaultRole = async () => {
    const advancedSettings =
      (await strapi.store({ type: 'plugin', name: 'users-permissions' }).get({ key: 'advanced' })) ||
      {};
    const roleType = advancedSettings.default_role || 'authenticated';

    const role = await strapi.db.query(ROLE_UID).findOne({
      where: { type: roleType },
    });

    if (!role) {
      throw new ApplicationError('Default authenticated role is missing.');
    }

    return role;
  };

  const findUniqueUsername = async (basename) => {
    const normalizedBase = (basename || 'github-user')
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/gu, '-')
      .replace(/^-+|-+$/gu, '')
      .slice(0, 28) || 'github-user';

    let candidate = normalizedBase;

    for (let attempt = 0; attempt < 12; attempt += 1) {
      const existing = await strapi.db.query(USER_UID).findOne({
        where: { username: candidate },
      });

      if (!existing) {
        return candidate;
      }

      candidate = `${normalizedBase}-${crypto.randomInt(1000, 9999)}`;
    }

    return `${normalizedBase}-${crypto.randomUUID().slice(0, 8)}`;
  };

  const exchangeCodeForToken = async (code, config) => {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: config.githubClientId,
        client_secret: config.githubClientSecret,
        code,
        redirect_uri: getCallbackUrl(config),
      }),
    });

    const body = await response.json();

    if (!response.ok || !body.access_token) {
      throw new ApplicationError(body.error_description || 'GitHub token exchange failed.');
    }

    return body.access_token;
  };

  const fetchGitHubProfile = async (accessToken) => {
    const baseHeaders = {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${accessToken}`,
      'User-Agent': 'LuneAIHelper',
      'X-GitHub-Api-Version': '2022-11-28',
    };

    const [userResponse, emailResponse] = await Promise.all([
      fetch('https://api.github.com/user', { headers: baseHeaders }),
      fetch('https://api.github.com/user/emails', { headers: baseHeaders }),
    ]);

    const userBody = await userResponse.json();
    const emailBody = await emailResponse.json();

    if (!userResponse.ok) {
      throw new ApplicationError(userBody.message || 'Could not fetch GitHub profile.');
    }

    const fallbackEmail = Array.isArray(emailBody)
      ? emailBody.find((entry) => entry.primary && entry.verified)?.email ||
        emailBody.find((entry) => entry.verified)?.email ||
        emailBody[0]?.email
      : null;

    const email = (userBody.email || fallbackEmail || '').toLowerCase();

    if (!email) {
      throw new ApplicationError('GitHub did not provide a usable email address.');
    }

    return {
      providerUid: String(userBody.id),
      name: userBody.name?.trim() || null,
      username: userBody.login || email.split('@')[0],
      email,
      avatarUrl: userBody.avatar_url || null,
    };
  };

  const upsertIdentity = async ({ providerUid, name, email, avatarUrl, userId }) => {
    const existingIdentity = await strapi.db.query(IDENTITY_UID).findOne({
      where: {
        provider: 'github',
        providerUid,
      },
    });

    if (existingIdentity) {
      return strapi.db.query(IDENTITY_UID).update({
        where: { id: existingIdentity.id },
        data: {
          name,
          email,
          avatarUrl,
          user: userId,
        },
      });
    }

    return strapi.db.query(IDENTITY_UID).create({
      data: {
        provider: 'github',
        providerUid,
        name,
        email,
        avatarUrl,
        user: userId,
      },
    });
  };

  const findOrCreateUserFromProfile = async (profile) => {
    const identity = await strapi.db.query(IDENTITY_UID).findOne({
      where: {
        provider: 'github',
        providerUid: profile.providerUid,
      },
      populate: ['user'],
    });

    if (identity?.user) {
      const updatedIdentity = await upsertIdentity({
        ...profile,
        userId: identity.user.id,
      });

      return {
        user: identity.user,
        identity: updatedIdentity,
      };
    }

    let user = await strapi.db.query(USER_UID).findOne({
      where: { email: profile.email },
    });

    if (!user) {
      const role = await getDefaultRole();
      const username = await findUniqueUsername(profile.username);

      user = await strapi.db.query(USER_UID).create({
        data: {
          username,
          email: profile.email,
          provider: 'github',
          confirmed: true,
          blocked: false,
          role: role.id,
        },
        populate: ['role'],
      });
    }

    const updatedIdentity = await upsertIdentity({
      ...profile,
      userId: user.id,
    });

    return {
      user,
      identity: updatedIdentity,
    };
  };

  const completeSession = async (session, user, identity) => {
    if (user.blocked) {
      throw new ForbiddenError('Your account has been blocked by an administrator.');
    }

    const issuedJwt = await Promise.resolve(
      strapi.plugin('users-permissions').service('jwt').issue({ id: user.id })
    );

    await strapi.db.query(AUTH_SESSION_UID).update({
      where: { id: session.id },
      data: {
        status: 'success',
        user: user.id,
        issuedJwt,
        errorCode: null,
      },
    });

    return formatUser(user, identity);
  };

  const loadIdentityForUser = async (userId) => {
    return strapi.db.query(IDENTITY_UID).findOne({
      where: {
        user: userId,
        provider: 'github',
      },
    });
  };

  return {
    async githubStart(locale) {
      const config = getPluginAuthConfig();
      const normalizedLocale = normalizeLocale(locale);
      const state = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + config.stateTtlMs);

      await strapi.db.query(AUTH_SESSION_UID).create({
        data: {
          state,
          status: 'pending',
          provider: 'github',
          expiresAt,
          locale: normalizedLocale,
        },
      });

      const authUrl = new URL('https://github.com/login/oauth/authorize');
      authUrl.searchParams.set('client_id', config.githubClientId);
      authUrl.searchParams.set('redirect_uri', getCallbackUrl(config));
      authUrl.searchParams.set('scope', config.githubScope.join(' '));
      authUrl.searchParams.set('state', state);
      authUrl.searchParams.set('allow_signup', 'true');

      return {
        state,
        authUrl: authUrl.toString(),
        expiresAt: expiresAt.toISOString(),
      };
    },

    async githubStatus(state) {
      const session = await ensureSessionIsActive(state);

      if (session.status === 'pending') {
        return {
          status: 'pending',
          expiresAt: session.expiresAt,
        };
      }

      if (session.status === 'success' && session.user && session.issuedJwt) {
        const identity = await loadIdentityForUser(session.user.id);
        const response = {
          status: 'success',
          token: session.issuedJwt,
          user: formatUser(session.user, identity),
          expiresAt: null,
        };

        await strapi.db.query(AUTH_SESSION_UID).update({
          where: { id: session.id },
          data: {
            status: 'consumed',
            issuedJwt: null,
          },
        });

        return response;
      }

      if (session.status === 'error') {
        return {
          status: 'error',
          message:
            session.errorCode === 'oauth_cancelled'
              ? 'GitHub login was cancelled.'
              : 'GitHub login failed.',
        };
      }

      if (session.status === 'expired') {
        return {
          status: 'expired',
          message: 'The login session expired. Please try again.',
        };
      }

      return {
        status: 'consumed',
        message: 'This login session has already been used.',
      };
    },

    async githubCallback(query) {
      const locale = normalizeLocale(query.locale);
      const brokenTitle = locale === 'en' ? 'something broke' : 'что-то сломалось';
      const brokenHelper = 'restart the sign-in from the plugin';

      if (!query.state) {
        return renderCallbackPage(
          locale,
          {
            title: brokenTitle,
            message:
              locale === 'en'
                ? 'github did not return a valid login state'
                : 'github не вернул корректный идентификатор входа',
            helper: escapeHtml(brokenHelper),
            variant: 'error',
          }
        );
      }

      let session;

      try {
        session = await ensureSessionIsActive(query.state);
      } catch (error) {
        return renderCallbackPage(
          locale,
          {
            title: brokenTitle,
            message:
              locale === 'en'
                ? 'the login session was not found'
                : 'сессия входа не была найдена',
            helper: escapeHtml(brokenHelper),
            variant: 'error',
          }
        );
      }

      const sessionLocale = normalizeLocale(session.locale);

      if (query.error) {
        await strapi.db.query(AUTH_SESSION_UID).update({
          where: { id: session.id },
          data: {
            status: 'error',
            errorCode: 'oauth_cancelled',
            issuedJwt: null,
          },
        });

        return renderCallbackPage(
          sessionLocale,
          {
            title: brokenTitle,
            message:
              sessionLocale === 'en'
                ? 'github sign-in was cancelled'
                : 'авторизация github была отменена',
            helper: escapeHtml(brokenHelper),
            variant: 'error',
          }
        );
      }

      try {
        const config = getPluginAuthConfig();
        const accessToken = await exchangeCodeForToken(query.code, config);
        const profile = await fetchGitHubProfile(accessToken);
        const { user, identity } = await findOrCreateUserFromProfile(profile);
        const formattedUser = formatUser(user, identity);
        const displayName = formattedUser.name || formattedUser.username;

        await completeSession(session, user, identity);

        return renderCallbackPage(
          sessionLocale,
          {
            title: `“${displayName}”!`,
            message:
              sessionLocale === 'en'
                ? 'you can open the app'
                : 'ты можешь вернуться в фигму',
            helper:
              sessionLocale === 'en'
                ? 'you can return to figma'
                : 'you can open the app',
            variant: 'success',
          }
        );
      } catch (error) {
        await strapi.db.query(AUTH_SESSION_UID).update({
          where: { id: session.id },
          data: {
            status: 'error',
            errorCode: 'oauth_failed',
            issuedJwt: null,
          },
        });

        return renderCallbackPage(
          sessionLocale,
          {
            title: brokenTitle,
            message:
              sessionLocale === 'en'
                ? 'github sign-in failed'
                : 'вход через github не выполнен',
            helper: escapeHtml(brokenHelper),
            variant: 'error',
          }
        );
      }
    },

    async me(ctx) {
      let tokenPayload;

      try {
        tokenPayload = await strapi.plugin('users-permissions').service('jwt').getToken(ctx);
      } catch (_error) {
        throw new UnauthorizedError('Missing or invalid auth token.');
      }

      if (!tokenPayload?.id) {
        throw new UnauthorizedError('Missing or invalid auth token.');
      }

      const user = await strapi.plugin('users-permissions').service('user').fetchAuthenticatedUser(
        tokenPayload.id
      );

      if (!user) {
        throw new UnauthorizedError('Authenticated user was not found.');
      }

      if (user.blocked) {
        throw new ForbiddenError('Your account has been blocked by an administrator.');
      }

      const identity = await loadIdentityForUser(user.id);

      return {
        user: formatUser(user, identity),
      };
    },
  };
};
