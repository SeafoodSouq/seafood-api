module.exports = {


  friendlyName: 'Fish type tree',


  description: '',


  inputs: {
    parent: {
      type: "string",
      required: false
    },
    level: {
      type: "string",
      required: false
    },
  },


  exits: {
    outputType:{
      result: "ref"
    }
  },


  fn: async function (inputs, exits) {
    let types = await FishType.find( { level: 0 } );

    await Promise.all( types.map( async (type0) => {
        let childs0 = await FishType.find( { level:1, parent: type0.id } );
        let ico0 = await IncotermsByType.find( { type: type0.id } ).populate( 'incoterm' );
        type0['incoterms'] = ico0;
        childs0.map( ( species, index ) => {
          console.log( [type0.id] );
          species['parents_ids'] = [ type0.id ]
        } );

        type0['hadFish'] = false;
        if( childs0.length == 0 ) {
          type0['hadFish'] = false;
        }

        await Promise.all(  childs0.map( async ( type1 ) => {
            let childs1 = await FishType.find( { level:2, parent: type1.id } );
            let ico1 = await IncotermsByType.find( { type: type1.id } ).populate( 'incoterm' );
            type1['incoterms'] = ico1;


            childs1.map( ( subspecies, index ) => {
              console.log( [ type1.id, type0.id ] );
              subspecies['parents_ids'] = [ type1.id, type0.id ]              
            } );
            type1['hadFish'] = false;
            if( childs1.length == 0 ) {
              type1['hadFish'] = false;
            }

            await Promise.all( childs1.map( async (type2) => {
                let childs2 = await FishType.find( { level:3, parent: type2.id } )
                let hadFish = await Fish.find( { type: type2.id } ).limit(1);
                let ico2 = await IncotermsByType.find( { type: type2.id } ).populate( 'incoterm' );
                type2['incoterms'] = ico2;

                if( hadFish.length > 0 ) {
                  type2['hadFish'] = true;
                  type1['hadFish'] = true;
                  type0['hadFish'] = true;
                } else {
                  type2['hadFish'] = false;
                }


                childs2.map( ( descriptor, index ) => {
                  console.log( [ type2.id, type1.id, type0.id ] );
                  descriptor['parents_ids'] = [ type2.id, type1.id, type0.id ]
                } );

                type2.childs = childs2;
            } ) )

            type1.childs = childs1;

        } ) )
        type0.childs = childs0;
    } ) )
    // All done.
    return exits.success( types );

  }


};

