/**
 * OrderStatusController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {

    getLogisticOrderstatus: async (req, res) => {
        try {
            var ids = ['5c017ae247fb07027943a404', '5c017af047fb07027943a405', '5c017b5a47fb07027943a40c', '5c06f4bf7650a503f4b731fd', '5c017b0e47fb07027943a406', '5c017b1447fb07027943a407', '5c017b2147fb07027943a408', '5c017b3c47fb07027943a409'];
            let orderStatus = await OrderStatus.find({ id: ids });

            return res.json(orderStatus);
        } catch (error) {
            console.log(error);
        }
    },
    getPaymentOrderstatus: async (req, res) => {
        try {
            var ids = ['5c017b4f47fb07027943a40b', '5c017b6847fb07027943a40d', '5c017b7047fb07027943a40e', '5c017b4547fb07027943a40a'];
            let orderStatus = await OrderStatus.find({ id: ids });

            return res.json(orderStatus);
        } catch (error) {
            console.log(error);
        }
    },

    getLogisticOrderstatusPagination: async (req, res) => {
        try {
            var ids = ['5c017ae247fb07027943a404', '5c017af047fb07027943a405', '5c017b5a47fb07027943a40c', '5c06f4bf7650a503f4b731fd', '5c017b0e47fb07027943a406', '5c017b1447fb07027943a407', '5c017b2147fb07027943a408', '5c017b3c47fb07027943a409'];
            let limit = Number(req.param("limit"));
            let skip = (Number(req.param("page")) - 1) * limit;
            let totalResults = await OrderStatus.count({ id: ids });

            let orderStatus = await OrderStatus.find({ where: { id: ids }, skip, limit });

            return res.pagination({ page: req.param("page"), limit, datas: orderStatus, totalResults });
        } catch (error) {
            console.log(error);
        }
    },
    getPaymentOrderstatusPagination: async (req, res) => {
        try {
            var ids = ['5c017b4f47fb07027943a40b', '5c017b6847fb07027943a40d', '5c017b7047fb07027943a40e', '5c017b4547fb07027943a40a'];
            let limit = Number(req.param("limit"));
            let skip = (Number(req.param("page")) - 1) * limit;
            let totalResults = await OrderStatus.count({ id: ids });
            
            let orderStatus = await OrderStatus.find({ where: { id: ids }, skip, limit });

            return res.pagination({ page: req.param("page"), limit, datas: orderStatus, totalResults });
        } catch (error) {
            console.log(error);
        }
    },
};

