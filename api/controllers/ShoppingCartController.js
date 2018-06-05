
module.exports = {
  addItem: async (req, res)=>{
    try{
        let id = req.param("id"), 
        item = {
            shoppingCart: id,
            fish: req.param("fish"),
            quantity: req.param("quantity"),
            price: req.param("price")
        };

        let itemShopping = await ItemShopping.create(item);
        let cart = await ShoppingCart.findOne({ id }).populate("items");
        cart.items = await Promise.all(cart.items.map(async (i)=>{
            i.fish = await Fish.findOne({ id: i.fish });
            return i;
        }));
        res.json(cart);
    }
    catch(e){
        console.error(e);
        res.serverError(e);
    }
  }

};

