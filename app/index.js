const {Keystone} = require('@keystonejs/keystone');
const {PasswordAuthStrategy} = require('@keystonejs/auth-password');
const {Text, Checkbox, Password, Relationship, Float, Location, Url, CalendarDay, Uuid} = require('@keystonejs/fields');
const {GraphQLApp} = require('@keystonejs/app-graphql');
const {AdminUIApp} = require('@keystonejs/app-admin-ui');
const {atTracking} = require('@keystonejs/list-plugins');
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
        id: {
            type: Uuid,
            isUnique: true,
            knexOptions: {
                defaultTo: knex => knex.raw('gen_random_uuid()'),
            },
        },
        name: {
            type: Text,
            isUnique: true,
            isRequired: true,
        },
    },
    plugins: [
        atTracking(),
    ],
});

keystone.createList('Tag', {
    fields: {
        id: {
            type: Uuid,
            isUnique: true,
            knexOptions: {
                defaultTo: knex => knex.raw('gen_random_uuid()'),
            },
        },
        name: {
            type: Text,
            isUnique: true,
            isRequired: true,
        },
        language: {
            type: Relationship,
            ref: 'Language',
            many: false,
            isRequired: true,
        },
    },
    plugins: [
        atTracking(),
    ],
});

keystone.createList('Language', {
    fields: {
        id: {
            type: Uuid,
            isUnique: true,
            knexOptions: {
                defaultTo: knex => knex.raw('gen_random_uuid()'),
            },
        },
        name: {
            type: Text,
            isUnique: true,
            isRequired: true,
        },
    },
    plugins: [
        atTracking(),
    ],
});

keystone.createList('GeoLocation', {
    fields: {
        id: {
            type: Uuid,
            isUnique: true,
            knexOptions: {
                defaultTo: knex => knex.raw('gen_random_uuid()'),
            },
        },
        name: {
            type: Text,
            isUnique: true,
            isRequired: true,
        },
        location: {
            type: Location,
            googleMapsKey: 'AIzaSyCs_yZuXjG54hm3vsl66MWCLa56Cm05_hA',
            isRequired: true,
        },
        radius: {
            type: Float,
            isRequired: true,
        },
    },
    plugins: [
        atTracking(),
    ],
});

keystone.createList('Source', {
    fields: {
        id: {
            type: Uuid,
            isUnique: true,
            knexOptions: {
                defaultTo: knex => knex.raw('gen_random_uuid()'),
            },
        },
        name: {
            type: Text,
            isRequired: true,
        },
        url: {
            type: Url,
            isRequired: true,
        },
        location: {
            type: Relationship,
            ref: 'GeoLocation',
            many: false,
            isRequired: true,
        },
    },
    plugins: [
        atTracking(),
    ],
});

keystone.createList('Widget', {
    fields: {
        id: {
            type: Uuid,
            isUnique: true,
            knexOptions: {
                defaultTo: knex => knex.raw('gen_random_uuid()'),
            },
        },
        name: {
            type: Text,
            isRequired: true,
        },
        organization: {
            type: Relationship,
            ref: 'Organization',
            many: false,
            isRequired: true,
        },
        language: {
            type: Relationship,
            ref: 'Language',
            many: false,
            isRequired: true,
        },
        sources: {
            type: Relationship,
            ref: 'Source',
            many: true,
            isRequired: true,
        },
    },
    plugins: [
        atTracking(),
    ],
});

keystone.createList('Entry', {
    fields: {
        id: {
            type: Uuid,
            isUnique: true,
            knexOptions: {
                defaultTo: knex => knex.raw('gen_random_uuid()'),
            },
        },
        publishDate: {
            type: CalendarDay,
            isRequired: true,
        },
        title: {
            type: Text,
            isRequired: true,
        },
        image: {
            type: Url,
        },
        content: {
            type: Text,
            isRequired: true,
        },
        url: {
            type: Url,
            isRequired: true,
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
            isRequired: true,
        },
        source: {
            type: Relationship,
            ref: 'Source',
            many: false,
            isRequired: true,
        },
    },
    plugins: [
        atTracking(),
    ],
});

keystone.createList('User', {
    fields: {
        id: {
            type: Uuid,
            isUnique: true,
            knexOptions: {
                defaultTo: knex => knex.raw('gen_random_uuid()'),
            },
        },
        name: {
            type: Text,
            isRequired: true,
        },
        email: {
            type: Text,
            isUnique: true,
            isRequired: true,
        },
        isAdmin: {
            type: Checkbox,
            defaultValue: false,
            // Field-level access controls
            // Here, we set more restrictive field access so a non-admin cannot make themselves admin.
            access: {
                update: access.userIsAdmin,
            },
        },
        password: {
            type: Password,
            isRequired: true,
        },
        organization: {
            type: Relationship,
            ref: 'Organization',
            many: false,
            isRequired: true,
        },
    },
    plugins: [
        atTracking(),
    ],
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
