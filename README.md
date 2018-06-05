# team-snap-api

API for seafood app 

## Getting Started
API development with sails


### Common Endpoints

All the models in the api have the following endpoints for create, destroy, update, find all, find one, search, populate

```
GET ALL => GET				http://server_address/api/:model_name
CREATE  => POST 			http://server_address/api/:model_name

GET ONE => GET				http://server_address/api/:model_name/:id
UPDATE  => PUT				http://server_address/api/:model_name/:id
DELETE  => DELETE 		http://server_address/api/:model_name/:id
```
####Search
SEARCH 	=> GET				http://server_address/api/:model_name?where={"name":{"contains":"theodore"}}

the api allow the followin criterias
```
    '<' / 'lessThan'
    '<=' / 'lessThanOrEqual'
    '>' / 'greaterThan'
    '>=' / 'greaterThanOrEqual'
    '!' / 'not'
    'like'
    'contains'
    'startsWith'
    'endsWith'
```
####Sort and Limit
In your GET petition you can ask the api for sort and/or limit the results
```
GET ALL => GET				http://server_address/api/:model_name?createdAt DESC&limit=30
```

### Current Models

```
Fish
FishType
Company
User
Store
```

### Custom endpoints:
```
PUT /api/login 
```
## Params
```
- email
- password

POST /api/signup

## Params
- email
- firstName
- lastName
- password
- dataExtra     //for save data of user 
- role 

example of role
"role": 0
0 for admin
1 for users seller
2 for users buyer


GET /api/fish/:page/:cantidad


GET /api/fish-type/:name/:page/:limit


GET /api/fish/:where     //where is joson

Example for where
GET /api/fish/{"quality":"good"}

```
#### for get name case insensitive
```
GET /api/fish/search/:name
```

#### for get multiple products with multiple ID's
```
GET /api/fish-ids/:array    //array is json

Example for array
GET /api/fish-ids/["5b0edb04f2cbe9223844ce2d","5b0f19eb48c1091b8c2710f8"]
```

#### for upload multiples images
```
POST /api/fish/images/:idProduct

the field of images has to be called images 

```
#### for delete image
```
DELETE /api/images/:namefile/:idProduct
```

#### for save images of category (fishtype)
```
POST /api/fishtype/images/:idFishType

field
images
```

#### for Store save
```
POST /api/store
Parameters
owner   //id user
description
logo    //image logo
```

###for save logo Store
```
POST /api/store/logo/:idStore

field
logo    //image
```

###for save hero Store
```
POST api/store/hero/:idStore

field
hero    //image
```

###for save gallery Store
```
POST /api/store/gallery/:idStore

field
images    //images
```

### Prerequisites

```
sails js global

```

### Installing
Just run

```
npm install sails -g
npm install
```

### Run

```
sails lift
```
