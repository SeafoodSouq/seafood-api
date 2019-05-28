module.exports = {


  friendlyName: 'Update category count',


  description: 'Update how much fishes had each category',


  inputs: {

  },


  exits: {

  },


  fn: async function (inputs, exits) {
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
        
        type0.childs = childs0;
        await FishType.update( { id: type0.id }, { totalFishes: mainCount } );
        
    } ) )    
    return exits.success();

  }


};

