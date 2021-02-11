const {Keystone} = require('@keystonejs/keystone');
const {PasswordAuthStrategy} = require('@keystonejs/auth-password');
const {
    Text,
    Integer,
    Checkbox,
    Password,
    Relationship,
    Float,
    Url,
    CalendarDay,
    Uuid,
} = require('@keystonejs/fields');
const {LocationGoogle} = require('@keystonejs/fields-location-google');
const {CloudinaryAdapter} = require('@keystonejs/file-adapters');
const {CloudinaryImage} = require('@keystonejs/fields-cloudinary-image');
const {GraphQLApp} = require('@keystonejs/app-graphql');
const {AdminUIApp} = require('@keystonejs/app-admin-ui');
const {atTracking} = require('@keystonejs/list-plugins');
const {KnexAdapter: Adapter} = require('@keystonejs/adapter-knex');
const initialiseData = require('./initial-data');

const PROJECT_NAME = 'CoVerified/Backend';

const SECRETS = {
    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'secret',
        apiKey: process.env.CLOUDINARY_KEY || 'secret',
        apiSecret: process.env.CLOUDINARY_SECRET || 'secret',
    },
    googleMapsKey: process.env.GOOGLE_MAPS_API_KEY || 'secret',
    cookieSecret: process.env.COOKIE_SECRET || 'secret',
};

console.log(`\n\n[ BEGIN: Secrets config ]\n\n`);
console.log(SECRETS);
console.log(`\n\n[ END: Secrets config ]\n\n`);

const adapterConfig = {
    knexOptions: {
        connection: process.env.DB_CONNECTION
    },
};

const cloudinaryFileAdapter = new CloudinaryAdapter({
    ...SECRETS.cloudinary,
    folder: 'coverified_platform_backend',
});

process.env['PORT'] = '3000';

const keystone = new Keystone({
    name: PROJECT_NAME,
    cookieSecret: SECRETS.cookieSecret,
    cookie: {
        secure: SECRETS.cookieSecret !== 'secret',
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
        description: {
            type: Text,
            isRequired: false,
        },
        relevance: {
            type: Integer,
        },
        image: {
            type: CloudinaryImage,
            adapter: cloudinaryFileAdapter,
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
            type: LocationGoogle,
            googleMapsKey: SECRETS.googleMapsKey,
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
        description: {
            type: Text,
            isRequired: false,
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
            type: CloudinaryImage,
            adapter: cloudinaryFileAdapter,
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
