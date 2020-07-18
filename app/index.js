const {Keystone} = require('@keystonejs/keystone');
const {PasswordAuthStrategy} = require('@keystonejs/auth-password');
const {Text, Checkbox, Password, Relationship, Float, Location, Url, CalendarDay, DateTime} = require('@keystonejs/fields');
const {GraphQLApp} = require('@keystonejs/app-graphql');
const {AdminUIApp} = require('@keystonejs/app-admin-ui');
const initialiseData = require('./initial-data');
const {KnexAdapter: Adapter} = require('@keystonejs/adapter-knex');

const PROJECT_NAME = 'CoVerified/Backend';

const adapterConfig = {
    knexOptions: {
        connection: process.env.DB_CONNECTION
    },
};

const keystone = new Keystone({
    name: PROJECT_NAME,
    cookieSecret: process.env.COOKIE_SECRET,
    cookie: {
        secure: process.env.COOKIE_SECRET !== 'secret',
        maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
        sameSite: false,
    },
    adapter: new Adapter(adapterConfig),
    onConnect: process.env.CREATE_TABLES !== 'true' && initialiseData,
});

// Access control functions
const userIsAdmin = ({authentication: {item: user}}) => Boolean(user && user.isAdmin);

const userOwnsItem = ({authentication: {item: user}}) => {
    if (!user) {
        return false;
    }

    // Instead of a boolean, you can return a GraphQL query:
    // https://www.keystonejs.com/api/access-control#graphqlwhere
    return {id: user.id};
};

const userIsAdminOrOwner = auth => {
    const isAdmin = access.userIsAdmin(auth);
    const isOwner = access.userOwnsItem(auth);
    return isAdmin ? isAdmin : isOwner;
};

const access = {userIsAdmin, userOwnsItem, userIsAdminOrOwner};

keystone.createList('Organization', {
    fields: {
        name: {
            type: Text,
            isUnique: true,
        },
    },
});

keystone.createList('Tag', {
    fields: {
        name: {
            type: Text,
            isUnique: true,
        },
    },
});

keystone.createList('Language', {
    fields: {
        name: {
            type: Text,
            isUnique: true,
        },
    },
});

keystone.createList('GeoLocation', {
    fields: {
        name: {
            type: Text,
            isUnique: true,
        },
        location: {
            type: Location,
            googleMapsKey: 'AIzaSyCs_yZuXjG54hm3vsl66MWCLa56Cm05_hA',
        },
        radius: {
            type: Float,
        },
    },
});

keystone.createList('Source', {
    fields: {
        name: {
            type: Text,
        },
        url: {
            type: Url,
        },
        location: {
            type: Relationship,
            ref: 'GeoLocation',
            many: false,
        },
    },
});

keystone.createList('Widget', {
    fields: {
        name: {
            type: Text,
        },
        organization: {
            type: Relationship,
            ref: 'Organization',
            many: false,
        },
    },
});

keystone.createList('Entry', {
    fields: {
        publishDate: {
            type: CalendarDay,
        },
        title: {
            type: Text,
        },
        image: {
            type: Url,
        },
        content: {
            type: Text,
        },
        url: {
            type: Url,
        },
        tags: {
            type: Relationship,
            ref: 'Tag',
            many: true,
        },
        language: {
            type: Relationship,
            ref: 'Language',
            many: false,
        },
        createdAt: {
            type: DateTime,
        },
        updatedAt: {
            type: DateTime,
        },
    },
});

keystone.createList('User', {
    fields: {
        name: {type: Text},
        email: {
            type: Text,
            isUnique: true,
        },
        isAdmin: {
            type: Checkbox,
            // Field-level access controls
            // Here, we set more restrictive field access so a non-admin cannot make themselves admin.
            access: {
                update: access.userIsAdmin,
            },
        },
        password: {
            type: Password,
        },
        organization: {
            type: Relationship,
            ref: 'Organization',
            many: false,
        },
    },
    // List-level access controls
    access: {
        read: access.userIsAdminOrOwner,
        update: access.userIsAdminOrOwner,
        create: access.userIsAdmin,
        delete: access.userIsAdmin,
        auth: true,
    },
});


const authStrategy = keystone.createAuthStrategy({
    type: PasswordAuthStrategy,
    list: 'User',
});

module.exports = {
    keystone,
    apps: [
        new GraphQLApp(),
        new AdminUIApp({
            enableDefaultRoute: true,
            authStrategy,
        }),
    ],
    configureExpress: app => {
        app.set('trust proxy', true);
    },
};
