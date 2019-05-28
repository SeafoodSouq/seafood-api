const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const IMAGES = path.resolve(__dirname, '../../images/');
const rimraf = require("rimraf");
var mmm = require('mmmagic'),
    Magic = mmm.Magic,
    compress_images = require('compress-images'),
    findRemoveSync = require('find-remove'),
    imageSize = { width: 800, height: null }
folderCompress = "compress";

const deleteImagesF = async pat =>{
    return findRemoveSync(pat.replace(/\\/g, '/'), { maxLevel: 1, extensions: ".jpg,.JPG,.jpeg,.JPEG,.png,.svg,.gif".split(",") });
}
const extractNewName = (name, i, extension) => {
    extension = extension || "jpg";
    i = i || 0;
    return name.replace(/\s+/g, '-').replace(".", "").toLowerCase() + new Date().getTime() + "" + (i + 3) + "." + extension;
}

const compressImageFolder = async (inputPath, outputPath) => {

    inputPath += '*.{jpg,JPG,jpeg,JPEG,png,svg,gif}';
    inputPath = path.resolve(inputPath).replace(/\\/g, '/'); //.replace(/\\/g, "\\$&");
    outputPath = path.resolve(outputPath).replace(/\\/g, '/') + "/" //.replace(/\\/g, "\\$&");
    // console.log(inputPath, outputPath);
    await new Promise(resolve => {
        compress_images(inputPath, outputPath,
            { compress_force: false, statistic: true, autoupdate: true },
            false,
            { jpg: { engine: 'mozjpeg', command: ['-quality', '60'] } },
            { png: { engine: 'pngquant', command: ['--quality=20-50'] } },
            { svg: { engine: 'svgo', command: '--multipass' } },
            { gif: { engine: 'gifsicle', command: ['--colors', '64', '--use-col=web'] } },
            function (error, completed, statistic) {
                console.log('-------------');
                console.log(error);
                console.log(completed);
                console.log(statistic);
                console.log('-------------', path.resolve(outputPath, "../").replace(/\\/g, '/'));
                let resultDeletes = deleteImagesF(path.resolve(outputPath, "../"));
                console.log(resultDeletes);
                resolve();
            });
    });
}

const writeImage = async function (nameFile, directory, image) {
    return new Promise(function (resolve, reject) {

        fs.writeFile(path.join(directory, nameFile + '.jpg'), image, function (err) {

            if (err) {
                return reject(err);
            }

            resolve({ message: "success", path: directory + '/' + nameFile });

        });

    });
}

const resizeSave = async function (nameFile, directory, image, size) {

    return new Promise(function (resolve, reject) {

        sharp(image).resize(size.width, size.height)
            .crop(sharp.strategy.entropy)
            .toBuffer(async function (err, data, info) {
                if (err) { return reject(err); }

                try {
                    let write = await writeImage(nameFile, directory, data);
                    resolve(directory, data, info, true);
                }
                catch (e) {
                    reject(e);
                }

            });

    });
}

const resizeImage = async function (directory, size) {
    let image = fs.readFileSync(directory);
    return new Promise(function (resolve, reject) {

        sharp(image).resize(size.width, size.height)
            .crop(sharp.strategy.entropy)
            .toBuffer(async function (err, data, info) {
                if (err) { return reject(err); }

                try {
                    fs.writeFileSync(directory, data);
                    resolve(directory, data, info, true);
                }
                catch (e) {
                    reject(e);
                }

            });

    });
}

const singleImagesUpload = async function (imageBody, model, id, name) {
    //name = id + '-' +name;
    //console.log( imageBody[0] );
    let base64 = imageBody.replace(/^data:image\/jpeg;base64,/, '');
    base64 = base64.replace(/^data:image\/png;base64,/, '');
    let image = new Buffer(base64, 'base64');

    let directory = [];

    directory.push(path.resolve(__dirname, '../../assets/images/' + model));
    directory.push(path.resolve(__dirname, '../../assets/images/' + model + '/' + id));

    let nameFile = name; //id;

    //create directory if not exists
    if (!fs.existsSync(directory[0])) {
        fs.mkdirSync(directory[0]);
    }

    if (!fs.existsSync(directory[1])) {
        fs.mkdirSync(directory[1]);
    }

    //para original
    let original = await writeImage(nameFile, directory[1], image);
    console.log(original);
    return [original];

}

function getMimeFile(dirname) {
    return new Promise(function (resolve, reject) {
        var magic = new Magic(mmm.MAGIC_MIME_TYPE);
        magic.detectFile(dirname, function (err, result) {
            if (err) { return reject(err); };
            console.log(result);
            resolve(result);
        });
    });
}


const deleteImage = async function (req, res) {
    try {
        let id = req.param("id"), namefile = req.param("namefile");

        let directory = IMAGES + `${"/" + id + "/" + namefile}`;
        console.log("\n\n zzz", directory);

        let fish = await Fish.findOne({ id });
        if (fish === undefined) {
            return res.serverError("id not found");
        }

        if (fish.hasOwnProperty("images") && Object.prototype.toString.call(fish.images) === "[object Array]") {
            let index = fish.images.findIndex(function (i) { return i.filename === namefile })
            if (index !== -1) {
                if (fish.images.length === 1) {
                    fish.images = [];
                } else if (fish.images.length > 1) {
                    fish.images.splice(index, 1);
                }
            }
        }
        console.log("\n\nzzz", "images despues eliminar", fish.images);
        let upda = await Fish.update({ id: fish.id }, { images: fish.images });
        //console.log(upda);

        if (!fs.existsSync(directory)) {
            throw new Error("file not exist");
        }

        // read binary data
        var data = fs.unlinkSync(directory);

        res.json({ msg: "success" })

    }
    catch (e) {
        //console.log(e);
        res.serverError(e);
    }
}

const multipleImagesUpload = async function (req, res) {

    let fish = await Fish.findOne({ id: req.params.id });
    if (fish === undefined) {
        return res.serverError("id not found");
    }

    let dirname = IMAGES + "/" + req.params.id;
    //create directory if not exists
    if (!fs.existsSync(dirname)) {
        fs.mkdirSync(dirname);
    }

    let imagesName = [], i = 0;

    req.file("images").upload({
        dirname,
        maxBytes: 70000000,
        saveAs: function (stream, cb) {
            // changin name to sku format
            let newName = stream.filename;
            newName = extractNewName(newName, i);
            imagesName.push(newName);
            i += 1;
            cb(null, newName);
        }
    }, async function (err, uploadedFiles) {
        if (err) return res.send(500, err);

        i = 0;
        let dirs = [];
        for (let file of uploadedFiles) {
            // changing name to sku format
            let newName = imagesName[i];
            if (file.type.includes("image/") && file["status"] === "finished") {
                dirs.push({
                    filename: newName,
                    src: "/api/images" + "/" + newName + "/" + req.params.id
                });
                //for resizing image
                try {
                    let directory = IMAGES + `${"/" + req.params.id + "/" + newName}`;
                    console.log(directory);
                    await resizeImage(directory, imageSize);
                }
                catch (e) {
                    console.error(e);
                }
            }
            i += 1;
        }
        let directory = IMAGES + "/" + req.params.id + "/";
        await compressImageFolder(directory, directory + folderCompress);

        if (fish.hasOwnProperty("images") && Object.prototype.toString.call(fish.images) === "[object Array]") {
            for (let dir of dirs) {
                fish.images.push(dir);
            }
        } else {
            fish.images = dirs;
        }

        let upda = await Fish.update({ id: fish.id }, { images: fish.images });
        ////console.log(upda);

        return res.json(fish.images);
    })
}

module.exports = {

    uploadShippingInformation: async (req, res) => {
        try {
            let orderID = req.params.id;
            let shippingImagePath = 'ItemShopping/shipping/images';
            //console.dir( req.body.image0 );
            //console.log(  req.body.image1  );
            let image0 = await singleImagesUpload(req.body.image0, shippingImagePath, orderID, 0);
            let image1 = await singleImagesUpload(req.body.image1, shippingImagePath, orderID, 1);
            let image2 = await singleImagesUpload(req.body.image2, shippingImagePath, orderID, 2);
            let image3 = await singleImagesUpload(req.body.image3, shippingImagePath, orderID, 3);
            let image4 = await singleImagesUpload(req.body.image4, shippingImagePath, orderID, 4);
            let image5 = await singleImagesUpload(req.body.image5, shippingImagePath, orderID, 5);
            let image6 = await singleImagesUpload(req.body.image6, shippingImagePath, orderID, 6);
            let image7 = await singleImagesUpload(req.body.image7, shippingImagePath, orderID, 7);
            let image8 = await singleImagesUpload(req.body.image8, shippingImagePath, orderID, 8);
            let image9 = await singleImagesUpload(req.body.image9, shippingImagePath, orderID, 9);

            let images_url = [
                orderID + '/' + '0.jpg',
                orderID + '/' + '1.jpg',
                orderID + '/' + '2.jpg',
                orderID + '/' + '3.jpg',
                orderID + '/' + '4.jpg',
                orderID + '/' + '5.jpg',
                orderID + '/' + '6.jpg',
                orderID + '/' + '7.jpg',
                orderID + '/' + '8.jpg',
                orderID + '/' + '9.jpg'
            ];
            /*let images_url = [ 
                shippingImagePath + '/' + orderID + '-0.jpg', 
                shippingImagePath + '/' + orderID + '-1.jpg', 
                shippingImagePath + '/' + orderID + '-2.jpg', 
                shippingImagePath + '/' + orderID + '-3.jpg', 
                shippingImagePath + '/' + orderID + '-4.jpg', 
                shippingImagePath + '/' + orderID + '-5.jpg', 
                shippingImagePath + '/' + orderID + '-6.jpg', 
                shippingImagePath + '/' + orderID + '-7.jpg', 
                shippingImagePath + '/' + orderID + '-8.jpg', 
                shippingImagePath + '/' + orderID + '-9.jpg'
            ];*/
            console.log(images_url);

            updateItemShopping = await ItemShopping.update({ id: orderID }, { shippingFiles: images_url });


            //console.log( image1 );

            res.status(200).json(updateItemShopping, image0, image1, image2, image3, image4, image5, image6, image7, image8, image9);
        } catch (error) {
            res.serverError(error);
        }

    },
    serveShippingImage: async (req, res) => {
        console.log('found');
        try {
            let rootImagePath = path.resolve(__dirname, '../../assets/images/');
            let imagePath = req.param("itemID");
            let namefile = req.param("imageIndex") + '.jpg';
            console.log(namefile);


            let shippingImagePath = '/ItemShopping/shipping/images';
            console.log(rootImagePath);
            let directory = rootImagePath + shippingImagePath + '/' + imagePath + '/' + namefile;
            console.log(directory);
            if (!fs.existsSync(directory)) {
                throw new Error("file not exist");
            }

            // read binary data
            var data = fs.readFileSync(directory);
            // convert binary data to base64 encoded string
            let content = 'image/' + namefile.split(".").pop();
            res.contentType(content);
            res.send(data);

            //res.status(200).json( { "message": "found it" } );
        } catch (error) {
            console.log(error);
            res.serverError(error);
        }
    },

    imagesUpload: async function (req, res) {

        ItemShoppingID = req.param("id");


        return new Promise(async (resolve, reject) => {
            try {

                let dirname = path.join(IMAGES, "/ItemShopping/", ItemShoppingID);
                let itemShopping = await ItemShopping.findOne({ id: ItemShoppingID });
                console.log(ItemShopping);

                //create directory if not exists
                if (!fs.existsSync(dirname)) {
                    fs.mkdirSync(dirname);
                }

                req.file("images").upload({
                    dirname,
                    maxBytes: 7000000,
                    saveAs: function (stream, cb) {
                        ////console.log(stream);
                        let newName = stream.filename;
                        newName = newName.replace(/\s+/g, '-').toLowerCase();
                        cb(null, stream.filename);
                    }
                }, async function (err, uploadedFiles) {
                    if (err) {
                        reject(err);
                        if (res !== false) {
                            res.serverError(err);
                        }
                    }

                    let dirs = [];
                    for (let file of uploadedFiles) {
                        let newName = file.filename;
                        newName = newName.replace(/\s+/g, '-').toLowerCase();
                        if (file.type.includes("image/") && file["status"] === "finished") {
                            dirs.push({
                                filename: file.filename,
                                src: "/api/ItemShopping/images/" + newName + "/" + ItemShoppingID
                            });
                        }
                    }
                    w
                    if (itemShopping.hasOwnProperty("shippingFiles") && Object.prototype.toString.call(itemShopping.shippingFiles) === "[object Array]") {
                        for (let dir of dirs) {
                            if (itemShopping.shippingFiles.findIndex(function (i) { return i.src === dir.src }) === -1) {
                                itemShopping.shippingFiles.push(dir);
                            }
                        }
                    } else {
                        itemShopping.shippingFiles = dirs;
                    }

                    let upda = await itemShopping.update({ id: ItemShoppingID }, { shippingFiles: itemShopping.shippingFiles }).fetch();

                    resolve(itemShopping);
                    if (res !== false) {
                        res.json(upda);
                    }
                })
            }
            catch (e) {
                console.error(e);
                reject(e);
                if (res !== false) {
                    res.serverError(e);
                }
            }
        });

    },

    deleteImagesFish: async (req, res) => {
        let deletedImages = req.param("deletedImages"); console.log("imagenes a borar", deletedImages);
        if (Object.prototype.toString.call(deletedImages) === "[object String]") {
            deletedImages = JSON.parse(deletedImages);
            function getIdName(ur) {
                return {
                    id: ur.split("/").pop(), namefile: ur.split("/").splice(-2, 1)[0]
                }
            };
            console.log("zzz", deletedImages);
            for (let img of deletedImages) {
                try {
                    let _req = Object.assign(getIdName(img),
                        { param: function (id) { return this[id] } }); console.log(_req);
                    await new Promise((resolve, reject) => {
                        let _res = {
                            json: resolve,
                            serverError: reject
                        };
                        deleteImage(_req, _res)
                    });
                }
                catch (e) {
                    console.error(e);
                }
            }
        }

        res.json({ mg: "ready" });
    },

    updateImages: async (req, res) => {
        try {
            await multipleImagesUpload(req, res);
        }
        catch (e) {
            console.error(e);
            res.serverError("error in upload");
        }
    },

    multipleImagesUpload,

    getImage: async function (req, res) {

        try {
            let id = req.param("id"), namefile = req.param("namefile");

            let dirname_old = path.join(IMAGES, id, namefile);
            let dirname_new = path.join(IMAGES, id, folderCompress, namefile);
            if (fs.existsSync(dirname_new) === true) directory = dirname_new;
            else directory = dirname_old;

            console.log(directory);

            if (!fs.existsSync(directory)) {
                throw new Error("file not exist");
            }

            // read binary data
            var data = fs.readFileSync(directory);

            // convert binary data to base64 encoded string
            let content = 'image/' + namefile.split(".").pop();
            res.contentType(content);
            res.send(data);

        }
        catch (e) {
            //console.log(e);
            res.serverError(e);
        }

    },

    deleteImage,

    saveLogoStore: async (req, res) => {
        let idStore = "";
        if (Object.prototype.toString.call(res) === "[object String]") {
            idStore = res;
            res = false;
        } else {
            idStore = req.param("id");
        }

        return new Promise((resolve, reject) => {
            try {
                let dirname = path.join(IMAGES, "/store/", idStore);

                //create directory if not exists
                if (!fs.existsSync(dirname)) {
                    fs.mkdirSync(dirname);
                }

                dirname = path.join(dirname, "/logo");
                if (!fs.existsSync(dirname)) {
                    fs.mkdirSync(dirname);
                }

                req.file("logo").upload({
                    dirname,
                    maxBytes: 5000000,
                    saveAs: function (stream, cb) {
                        //console.log(stream);
                        cb(null, stream.filename);
                    }
                }, async function (err, uploadedFiles) {
                    if (err) {
                        reject(err);
                        if (res !== false) {
                            res.serverError(err);
                        }
                    }

                    let dir = "";
                    for (let file of uploadedFiles) {
                        if (file.type.includes("image/") && file["status"] === "finished") {
                            dir = "/api/store/images/logo/" + file.filename + "/" + idStore
                        }
                    }

                    let upda = await Store.update({ id: idStore }, { logo: dir }).fetch();

                    resolve(upda);
                    if (res !== false) {
                        res.json(upda);
                    }
                })
            }
            catch (e) {
                console.error(e);
                reject(e);
                if (res !== false) {
                    res.serverError(e);
                }
            }
        });
    },

    saveHeroStore: async (req, res) => {
        let idStore = "";
        if (Object.prototype.toString.call(res) === "[object String]") {
            idStore = res;
            res = false;
        } else {
            idStore = req.param("id");
        }

        return new Promise((resolve, reject) => {
            try {
                let dirname = path.join(IMAGES, "/store/", idStore);

                //create directory if not exists
                if (!fs.existsSync(dirname)) {
                    fs.mkdirSync(dirname);
                }

                dirname = path.join(dirname, "/hero")
                if (!fs.existsSync(dirname)) {
                    fs.mkdirSync(dirname);
                }

                req.file("hero").upload({
                    dirname,
                    maxBytes: 5000000,
                    saveAs: function (stream, cb) {
                        //console.log(stream);
                        cb(null, stream.filename);
                    }
                }, async function (err, uploadedFiles) {
                    if (err) {
                        reject(err);
                        if (res !== false) {
                            res.serverError(err);
                        }
                    }

                    let dir = "";
                    for (let file of uploadedFiles) {
                        if (file.type.includes("image/") && file["status"] === "finished") {
                            dir = "/api/store/images/hero/" + file.filename + "/" + idStore;
                        }
                    }

                    let upda = await Store.update({ id: idStore }, { heroImage: dir }).fetch();

                    resolve();
                    if (res !== false) {
                        res.json(upda);
                    }
                })
            }
            catch (e) {
                console.error(e);
                reject(e);
                if (res !== false) {
                    res.serverError(e);
                }
            }
        });
    },

    saveImagesStore: async (req, res) => {
        let idStore = "";
        if (Object.prototype.toString.call(res) === "[object String]") {
            idStore = res;
            res = false;
        } else {
            idStore = req.param("id");
        }

        return new Promise(async (resolve, reject) => {
            try {

                let dirname = path.join(IMAGES, "/store/", idStore);
                let store = await Store.findOne({ id: idStore });
                console.log(store);

                //create directory if not exists
                if (!fs.existsSync(dirname)) {
                    fs.mkdirSync(dirname);
                }

                req.file("images").upload({
                    dirname,
                    maxBytes: 5000000,
                    saveAs: function (stream, cb) {
                        ////console.log(stream);
                        cb(null, stream.filename);
                    }
                }, async function (err, uploadedFiles) {
                    if (err) {
                        reject(err);
                        if (res !== false) {
                            res.serverError(err);
                        }
                    }

                    let dirs = [];
                    for (let file of uploadedFiles) {
                        if (file.type.includes("image/") && file["status"] === "finished") {
                            dirs.push({
                                filename: file.filename,
                                src: "/api/store/images/" + file.filename + "/" + req.params.id
                            });
                        }
                    }

                    if (store.hasOwnProperty("galeryImages") && Object.prototype.toString.call(store.galeryImages) === "[object Array]") {
                        for (let dir of dirs) {
                            if (store.galeryImages.findIndex(function (i) { return i.src === dir.src }) === -1) {
                                store.galeryImages.push(dir);
                            }
                        }
                    } else {
                        store.galeryImages = dirs;
                    }

                    let upda = await Store.update({ id: idStore }, { galeryImages: store.galeryImages }).fetch();

                    resolve(store);
                    if (res !== false) {
                        res.json(upda);
                    }
                })
            }
            catch (e) {
                console.error(e);
                reject(e);
                if (res !== false) {
                    res.serverError(e);
                }
            }
        });
    },

    getLogoAndHeroStore: async (req, res) => {
        try {
            let dirname = path.join(IMAGES, "store", req.param("id"), req.param("main"), req.param("namefile"));
            console.log(dirname);
            if (!fs.existsSync(dirname)) {
                throw new Error("file not exist");
            }

            // read binary data
            var data = fs.readFileSync(dirname);

            // convert binary data to base64 encoded string
            let content = 'image/' + req.param("namefile").split(".").pop();
            res.contentType(content);
            res.send(data);
        }
        catch (e) {
            console.error(e);
            res.serverError(e);
        }

    },

    getImagesStore: async (req, res) => {
        try {
            let dirname = path.join(IMAGES, "store", req.param("id"), req.param("namefile"));
            console.log(dirname);
            if (!fs.existsSync(dirname)) {
                throw new Error("file not exist");
            }

            // read binary data
            var data = fs.readFileSync(dirname);

            // convert binary data to base64 encoded string
            let content = 'image/' + req.param("namefile").split(".").pop();
            res.contentType(content);
            res.send(data);
        }
        catch (e) {
            console.error(e);
            res.serverError(e);
        }
    },

    multipleImagesCategory: async function (req, res) {

        id = req.param("id");
        let type = await FishType.findOne({ id });
        if (type === undefined) {
            return res.serverError("id not found");
        }

        let dirname = path.join(IMAGES, "category", id);

        //create directory if not exists
        if (!fs.existsSync(dirname)) {
            fs.mkdirSync(dirname);
        }

        let images = [];
        ////console.log(req);
        req.file("images").upload({
            dirname,
            maxBytes: 20000000,
            saveAs: function (stream, cb) {
                //console.log(stream);
                cb(null, stream.filename);
            }
        }, async function (err, uploadedFiles) {
            if (err) return res.send(500, err);

            let dirs = [];
            for (let file of uploadedFiles) {
                if (file.type.includes("image/") && file["status"] === "finished") {
                    dirs.push({
                        filename: file.filename,
                        src: "/api/images/category/" + file.filename + "/" + req.params.id
                    });
                }
            }

            if (type.hasOwnProperty("images") && Object.prototype.toString.call(type.images) === "[object Array]") {
                for (let dir of dirs) {
                    if (type.images.findIndex(function (i) { return i.src === dir.src || i.filename === dir.filename }) === -1) {
                        type.images.push(dir);
                    }
                }
            } else {
                type.images = dirs;
            }

            let upda = await FishType.update({ id }, { images: type.images });
            ////console.log(upda);

            return res.json(type.images);
        });
    },

    getImagesCategory: async (req, res) => {
        try {
            let dirname = path.join(IMAGES, "category", req.param("id"), req.param("namefile"));
            console.log(dirname);
            if (!fs.existsSync(dirname)) {
                throw new Error("file not exist");
            }

            // read binary data
            var data = fs.readFileSync(dirname);

            // convert binary data to base64 encoded string
            let content = 'image/' + req.param("namefile").split(".").pop();
            res.contentType(content);
            res.send(data);
        }
        catch (e) {
            console.error(e);
            res.serverError(e);
        }

    },

    saveImageLicence: async (req, res) => {
        id = req.param("id");
        let user = await User.findOne({ id });
        if (user === undefined) {
            return res.serverError("id not found");
        }

        let dirname = path.join(IMAGES, "license", id);

        //create directory if not exists
        if (!fs.existsSync(dirname)) {
            fs.mkdirSync(dirname);
        }

        ////console.log(req);
        req.file("license").upload({
            dirname,
            maxBytes: 5000000,
            saveAs: function (stream, cb) {
                //console.log(stream);
                cb(null, stream.filename);
            }
        }, async function (err, uploadedFiles) {
            if (err) return res.send(500, err);

            let dir = "";
            for (let file of uploadedFiles) {
                if (file.type.includes("image/") && file["status"] === "finished") {
                    dir = "/api/images/license/" + file.filename + "/" + id;
                }
            }

            if (user.hasOwnProperty("dataExtra") && Object.prototype.toString.call(user.dataExtra) === "[object Object]") {
                user.dataExtra.uploadTradeLicense = dir;
            } else {
                user.dataExtra = {
                    uploadTradeLicense: dir
                };
            }

            let upda = await User.update({ id }, { dataExtra: user.dataExtra }).fetch();
            ////console.log(upda);

            return res.json(upda);
        });
    },

    getImagesLicense: async (req, res) => {
        try {
            let dirname = path.join(IMAGES, "license", req.param("id"), req.param("namefile"));
            console.log(dirname);
            if (!fs.existsSync(dirname)) {
                throw new Error("file not exist");
            }

            // read binary data
            var data = fs.readFileSync(dirname);

            // convert binary data to base64 encoded string
            let content = 'image/' + req.param("namefile").split(".").pop();
            res.contentType(content);
            res.send(data);
        }
        catch (e) {
            console.error(e);
            res.serverError(e);
        }

    },

    deleteImageCategory: async function (req, res) {
        try {
            let id = req.param("id"), namefile = req.param("namefile");

            let directory = path.join(IMAGES, "category", id, namefile);
            //console.log(directory);

            let type = await FishType.findOne({ id });
            if (type === undefined) {
                return res.serverError("id not found");
            }

            //console.log(upda);

            if (!fs.existsSync(directory)) {
                throw new Error("file not exist");
            }

            if (type.hasOwnProperty("images") && Object.prototype.toString.call(type.images) === "[object Array]") {
                let index = type.images.findIndex(function (i) { return i.filename === namefile })
                if (index !== -1) {
                    if (type.images.length === 1) {
                        type.images = [];
                    } else if (type.images.length > 1) {
                        type.images.splice(index, 1);
                    }
                }
            }

            let upda = await FishType.update({ id: type.id }, { images: type.images }).fetch();

            // read binary data
            var data = fs.unlinkSync(directory);

            res.json(upda);

        }
        catch (e) {
            //console.log(e);
            res.serverError(e);
        }
    },

    setPrimaryImage: async function (req, res) {

        try {
            let src = req.param("src"), id = req.param("id");

            let fish = await Fish.findOne({ id });
            if (fish === undefined) {
                return res.status(400).send("fish not found!");
            }


            let dirname = path.join(IMAGES, "primary", id);

            //create directory if not exists
            if (!fs.existsSync(dirname)) {
                fs.mkdirSync(dirname);
            }

            let newName = "";
            req.file("image")
                .upload({
                    dirname,
                    maxBytes: 70000000,
                    saveAs: function (stream, cb) {
                        newName = extractNewName(stream.filename);
                        cb(null, newName);
                    }
                }, async (err, uploadedFiles) => {

                    if (err) {
                        return res.status(500).send(err);
                    }
                    //Para eliminar las imagenes que antes 
                    //habian comprimidas
                    let dir = path.join(IMAGES, "primary", id, folderCompress);
                    deleteImagesF(dir);
                    await Fish.update({ id }, { imagePrimary: "/api/images/primary/" + newName + "/" + id });

                    //for resizing image
                    try {
                        let directory = IMAGES + `${"/primary/" + req.params.id + "/" + newName}`;
                        console.log(directory);
                        await resizeImage(directory, imageSize);
                    }
                    catch (e) {
                        console.error(e);
                    }

                    let directory = IMAGES + "/primary/" + id + "/";
                    await compressImageFolder(directory, directory + folderCompress);


                    res.json({ msg: "success" });
                })

        }
        catch (e) {
            console.error(e);
            res.serverError(e);
        }
    },

    getImagePrimary: async (req, res) => {
        try {
            let dirname_old = path.join(IMAGES, "primary", req.param("id"), req.param("namefile"));
            let dirname_new = path.join(IMAGES, "primary", req.param("id"), folderCompress, req.param("namefile"));
            let dirname = "";
            if (fs.existsSync(dirname_new) === true) dirname = dirname_new;
            else dirname = dirname_old;

            if (!fs.existsSync(dirname)) {
                throw new Error("file not exist");
            }

            // read binary data
            var data = fs.readFileSync(dirname);

            // convert binary data to base64 encoded string
            let content = 'image/' + req.param("namefile").split(".").pop();
            res.contentType(content);
            res.send(data);
        }
        catch (e) {
            console.error(e);
            res.serverError(e);
        }

    },

    updateImagePrimary: async (req, res) => {
        try {
            let id = req.param("id"), namefile = req.param("namefile");

            let fish = await Fish.findOne({ id });
            if (fish === undefined) {
                return res.status(400).send("fish not found!");
            }

            await Fish.update({ id }, { imagePrimary: "" });

            let dirname = path.join(IMAGES, "primary", id);

            //create directory if not exists
            if (!fs.existsSync(dirname)) {
                fs.mkdirSync(dirname);
            }

            let directory = path.join(IMAGES, "primary", id, namefile);

            // read binary data
            if (fs.existsSync(directory)) {
                fs.unlinkSync(directory);
            }

            let newName = "";
            req.file("image")
                .upload({
                    dirname,
                    maxBytes: 70000000,
                    saveAs: function (stream, cb) {
                        newName = extractNewName(stream.filename);
                        cb(null, newName);
                    }
                }, async (err, uploadedFiles) => {
                    if (err) { return res.serverError(err); }
                    
                    //Para eliminar las imagenes que antes 
                    //habian comprimidas
                    let dir = path.join(IMAGES, "primary", id, folderCompress);
                    deleteImagesF(dir);

                    await Fish.update({ id }, { imagePrimary: "/api/images/primary/" + newName + "/" + id });
                    //for resizing image
                    try {
                        let directory = IMAGES + `${"/primary/" + id + "/" + newName}`;
                        console.log(directory);
                        await resizeImage(directory, imageSize);
                    }
                    catch (e) {
                        console.error(e);
                    }

                    let directory = IMAGES + "/primary/" + id + "/";
                    await compressImageFolder(directory, directory + folderCompress);
                    res.json({ msg: "success" });
                })
        }
        catch (e) {
            console.error(e);
            res.serverError(e);
        }
    },

    deleteImageXDirName: (dirs) => {
        return new Promise((resolve, reject) => {

            let dirname = IMAGES;
            for (let arg of dirs) {
                if (Object.prototype.toString.call(arg) === '[object String]') {
                    dirname = path.join(dirname, arg);
                }
            }

            console.log(dirname);
            if (fs.existsSync(dirname) === true) {
                console.log(true);
                rimraf(dirname, (er) => {
                    if (er) { return reject(er); }

                    resolve();
                });
            }

        })
    },

    saveImageTrackingFile: async (req, res) => {
        id = req.param("id");
        let item = await ItemShopping.findOne({ id });
        if (item === undefined) {
            return res.serverError("id not found");
        }

        let dirname = path.join(IMAGES, "trackingfile", id);

        //create directory if not exists
        if (!fs.existsSync(dirname)) {
            fs.mkdirSync(dirname);
        }

        ////console.log(req);
        req.file("file").upload({
            dirname,
            maxBytes: 5000000,
            saveAs: function (stream, cb) {
                //console.log(stream);
                cb(null, stream.filename);
            }
        }, async function (err, uploadedFiles) {
            if (err) return res.send(500, err);

            let dir = "";
            for (let file of uploadedFiles) {
                if (file["status"] === "finished") {
                    dir = "/api/images/trackingfile/" + file.filename + "/" + id;
                }
            }

            item.trackingFile = dir;

            let upda = await ItemShopping.update({ id }, { trackingFile: item.trackingFile }).fetch();
            ////console.log(upda);

            return res.json(upda);
        });
    },

    getTrackingFile: async (req, res) => {
        try {
            let dirname = path.join(IMAGES, "trackingfile", req.param("id"), req.param("namefile"));
            console.log(dirname);
            if (!fs.existsSync(dirname)) {
                throw new Error("file not exist");
            }

            // read binary data
            var data = fs.readFileSync(dirname);

            //get mime type file
            let mimeType = await new Promise(function (resolve, reject) {
                var magic = new Magic(mmm.MAGIC_MIME_TYPE);
                magic.detectFile(dirname, function (err, result) {
                    if (err) { return reject(err); };
                    console.log(result);
                    resolve(result);
                });
            });

            // convert binary data to base64 encoded string
            res.setHeader('Content-disposition', 'attachment; filename=' + req.param("namefile"));
            res.contentType(mimeType)
            res.send(data);
        }
        catch (e) {
            console.error(e);
            res.serverError(e);
        }

    },

    saveImageLogoCompany: async (req, res) => {
        try {
            let id = req.body.id;
            let base64 = req.body.logoCompany.replace(/^data:image\/jpeg;base64,/, "");
            base64 = base64.replace(/^data:image\/png;base64,/, "");
            var image = new Buffer(base64, 'base64');
            let directory = path.join(IMAGES, id);
            if (!fs.existsSync(directory)) {
                fs.mkdirSync(directory);
            }

            await resizeSave("logo-small.jpg", directory, image, { width: 50, height: 50 });
            await writeImage("logo.jpg", directory, image);
            let users = await User.update({ id }, { logoCompany: `/api/logo-company/${id}` }).fetch();
            console.log(users);
            if (users.length === 1) {
                return res.json(users[0]);
            }

            res.status(400);
            res.send("not found");

        }
        catch (e) {
            console.error(e);
            res.serverError(e);
        }
    },

    getImageLogoCompany: async function (req, res) {

        try {
            let directory = path.join(path.resolve(__dirname, '../../images/'), "/company");
            let id = req.param("userID"), namefile = req.param("namefile");

            if (req.query.small !== undefined) {
                directory = path.join(directory, id, "logo-small.jpg");
            } else {
                directory = path.join(directory, id, "logo.jpg");
            }
            console.log(directory);

            if (!fs.existsSync(directory)) {
                throw new Error("file not exist");
            }

            // read binary data
            var data = fs.readFileSync(directory);

            // convert binary data to base64 encoded string
            let content = 'image/jpg';
            res.contentType(content);
            res.send(data);

        }
        catch (e) {
            //console.log(e);
            res.serverError(e);
        }

    },

    getShippingFiles: async (req, res) => {
        try {
            let name = req.param("name");
            console.log(name);
            let id = req.param("id");
            console.log(id);
            console.log(sails.config.appPath);
            let path = `${sails.config.appPath}/shipping_documents/${id}/${name}`;
            console.log(path);
            //res.sendFile( path );
            res.download(path, name);
            console.log(path);

        } catch (error) {
            res.serverError(error);
        }
    },

}

