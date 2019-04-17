
module.exports = {

    getXNamePagination: async function (req, res) {
        try {

            let fisher = await FishType.findOne({ name: req.params.name });
            if (fisher === undefined) {
                return res.json({ fish: [], pagesNumber: 0 });
            }
            let page = req.params.page;
            --page; //Para que empieze desde 1
            let fishers = await Fish.find({ type: fisher.id }).populate('type').populate("store").paginate({ page, limit: req.params.limit });

            //Para calcular la cantidad de paginas
            let arr = await Fish.find({ type: fisher.id }),
                page_size = Number(req.params.limit), pages = 0;
            console.log(arr.length, Number(arr.length / page_size));
            if (parseInt(arr.length / page_size, 10) < Number(arr.length / page_size)) {
                pages = parseInt(arr.length / page_size, 10) + 1;
            } else {
                pages = parseInt(arr.length / page_size, 10)
            }

            fishers = await Promise.all(fishers.map(async function (m) {
                if (m.store === null)
                    return m;

                m.store.owner = await User.findOne({ id: m.store.owner });

                return m;
            }));

            res.json({ fish: fishers, pagesNumber: pages });
        }
        catch (e) {
            res.serverError(e);
        }
    },
    getParentTypes :  async ( req, res ) => {
        try {            
            let childs = await ParentType.find()
            .then(function ( result ) {
                return result.map( value => {
                    return value.child;
                } )
            })
            .catch(function (error) {
                console.log(error);
                return res.serverError(error);
            })

            let cats = await FishType.find({
                where: { id: { '!': childs } },
                sort: 'name ASC'
            })


             res.status(200).json( cats );
        } catch (error) {
            console.log(error);
            res.serverError(error);
        }
    },
    getParentChildTypes: async ( req, res ) => {
        try {            
            let parent_id = req.param('parent_id');
            
            let childs = await ParentType.find({
                where: { parent: parent_id }
            })
            .then(function ( result ) {
                return result.map( value => {
                    return value.child;
                } )
            })
            .catch(function (error) {
                console.log(error);
                return res.serverError(error);
            })
            

            let cats = await FishType.find({
                where: { id: childs  },
                sort: 'name ASC'
            })


             res.status(200).json( cats );
        } catch (error) {
            console.log(error);
            res.serverError(error);
        }
    },
    getChildTypes: async ( req, res ) => {
        try {                        
            let childs = await ParentType.find()
            .then(function ( result ) {
                return result.map( value => {
                    return value.child;
                } )
            })
            .catch(function (error) {
                console.log(error);
                return res.serverError(error);
            })
            

            let cats = await FishType.find({
                where: { id: childs  },
                sort: 'name ASC'
            })


             res.status(200).json( cats );
        } catch (error) {
            console.log(error);
            res.serverError(error);
        }
    },
    getTypeByLevel: async ( req, res ) => {
        try {
            let level = req.param( 'level' );
            let types = await FishType.find( { level } );

            res.status( 200 ).json( { types } );
        } catch (error) {
            res.status( 400 ).json( { error } );   
        }
    },
    getTypeLevel: async ( req, res ) => {
        try {
            let level0 = await FishType.find( { level: 0 } );
            let level1 = await FishType.find( { level: 1 } );
            let level2 = await FishType.find( { level: 2 } );
            let level3 = await FishType.find( { level: 3 } );

            res.status( 200 ).json( {
                level0, level1, level2, level3
            } )
        } catch (error) {
            res.status( 400 ).json( { error } );   
        }
    },
    getFishTypeTree: async (req, res) => {
        try {           
           let types = await sails.helpers.fishTypeTree();
            res.status( 200 ).json( types );
        } catch (error) {
            res.serverError();
        }
    },
    getAllParentsLevel: async ( req, res ) => {
        try {
            
            let types = await FishType.find( { level: [ 0, 1, 2 ] } );

            res.status( 200 ).json( types );
        } catch (error) {
            res.status( 400 ).json( { error } );
        }
    },
    getParentsWithFishes:async ( req, res )=> {
        try {
<<<<<<< HEAD
            let level0 = await FishType.find( { level: 0, totalFishes: { '>': 0 } } );
=======
            let level0 = await FishType.find( { level: 0 } );
>>>>>>> 2a947aa... adding count products to fish types

            res.status(200).json( level0 )
        } catch (error) {
            res.serverError( error );
        }
    },
<<<<<<< HEAD
    ori_getAllChildsByLevel: async ( req, res ) => {
=======
    getAllChildsByLevel: async ( req, res ) => {
>>>>>>> 2a947aa... adding count products to fish types
        try {
            let parent_id = req.param( 'parent_id' );
            let parent = await FishType.findOne( { id: parent_id, totalFishes: { '>': 0 } } );

            parentsIDS = [];
            parentsIDS.push( parent_id );
            childs = [];
            for (let index = parent.level + 1; index <= 4; index++) {                
                console.log( parentsIDS );
                directChilds = await FishType.find( { parent: parentsIDS, totalFishes: { '>': 0 } } );
                childs.push( { level: index, fishTypes: directChilds } );
                parentsIDS = [];
                directChilds.map( child => {
                    parentsIDS.push( child.id );
                } )
            }            

            res.status( 200 ).json( { childs } );
        } catch (error) {
            res.status( 400 ).json( { error } );   
        }
<<<<<<< HEAD
    },
    getAllChildsByLevel: async ( req, res ) => {
        try {
            let parent_id = req.param( 'parent_id' );
            let parent = await FishType.findOne( { id: parent_id, totalFishes: { '>': 0 } } );

            parentsIDS = [];
            parentsIDS.push( parent_id );
            childs = [];
            for (let index = parent.level + 1; index <= 4; index++) {                
                console.log( parentsIDS );
                directChilds = await FishType.find( { parent: parentsIDS, totalFishes: { '>': 0 } } );
                childs.push( { level: index, fishTypes: directChilds } );
                parentsIDS = [];
                directChilds.map( child => {
                    parentsIDS.push( child.id );
                } )
            }            

            res.status( 200 ).json( { childs } );
        } catch (error) {
            res.serverError( error );   
        }
=======
>>>>>>> 2a947aa... adding count products to fish types
    },   
    getParentLevel: async ( req, res ) => {
        try {
            let fishID = req.param( 'fishID' );

            console.log( fishID );
            
            let fish = await Fish.findOne( { id: fishID } ).populate('type').populate('descriptor');

            console.log( fish );
            let level2 = fish.type;
            
            let descriptor = fish.descriptor;
            

            let level1 = await FishType.findOne( { id: level2.parent } );

            let level0 = await FishType.findOne( { id: level1.parent } );

            res.status( 200 ).json( { level0, level1, level2, descriptor } );
            

        } catch (error) {
            res.status( 400 ).json( error );
        }
    },
    updateTypeCount: async (req, res) => {
        try {
<<<<<<< HEAD
            await sails.helpers.updateCategoryCount();
            let utypes = await FishType.find();
            res.status(200).json( utypes );
        } catch (error) {
            res.serverError(error);
        }
    },
    delete: async( req, res ) => {
        try {
            let id = req.param( 'id' );
            // check if had childs
            let childs = await FishType.find( { "parent": id } );

            if ( childs.length > 0 ) {
                /// we can't delete the type because had child categories
                res.status(400).json( { message: "Is not possible delete the item. first remove the child items" } );
            } else {
                // lets validate if the type had fishes
                let fishes = await Fish.find( { type: id } );

                if( fishes.length > 0 ) {
                    res.status(400).json( { message: "Is not possible delete the item. there is fishes under this category" } );
                } else {
                // no childs so let's deleted                    
                    let deleteFish = await FishType.destroy( { id } ).fetch();
                    res.status(200).json( deleteFish );
                }
            }

        } catch (error) {
            res.serverError( error );
=======
            let types = await FishType.find( { level: 0 } );

            await Promise.all( types.map( async (type0) => {
                // main category
                let childs0 = await FishType.find( { level:1, parent: type0.id } );
                let mainCount = 0;
                await Promise.all(  childs0.map( async ( type1 ) => {

                    // specie
                    let specieCount = 0;
                    let childs1 = await FishType.find( { level:2, parent: type1.id } );

                    await Promise.all( childs1.map( async (type2) => {
                        
                        // subspecie
                        let subSpecie = 0;
                        let childs2 = await FishType.find( { level:3, parent: type2.id } );
                        let fishes = await Fish.find( { type: type2.id, status: '5c0866f9a0eda00b94acbdc2' } );
                        let fishCount = fishes.length;
                        specieCount += fishCount;
                        await FishType.update( { id: type2.id }, { totalFishes: fishCount } );


                        type2.childs = childs2;
                    } ) )
                    await FishType.update( { id: type1.id }, { totalFishes: specieCount } );
                    mainCount += specieCount;
                    type1.childs = childs1;

                } ) )
                await FishType.update( { id: type0.id }, { totalFishes: mainCount } );
                type0.childs = childs0;
                
            } ) )
            let utypes = await FishType.find();
            res.status(200).json( utypes );
        } catch (error) {
            res.serverError(error);
>>>>>>> 2a947aa... adding count products to fish types
        }
    },
    delete: async( req, res ) => {
        try {
            let id = req.param( 'id' );
            // check if had childs
            let childs = await FishType.find( { "parent": id } );

            if ( childs.length > 0 ) {
                /// we can't delete the type because had child categories
                res.status(400).json( { message: "Is not possible delete the item. first remove the child items" } );
            } else {
                // lets validate if the type had fishes
                let fishes = await Fish.find( { type: id } );

                if( fishes.length > 0 ) {
                    res.status(400).json( { message: "Is not possible delete the item. there is fishes under this category" } );
                } else {
                // no childs so let's deleted                    
                    let deleteFish = await FishType.destroy( { id } ).fetch();
                    res.status(200).json( deleteFish );
                }
            }

        } catch (error) {
            res.serverError( error );
        }
    }
};

