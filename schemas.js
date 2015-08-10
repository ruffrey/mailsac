'use strict';
module.exports = function (mongoose) {

    var schemas = {};

    /**
     * Message model
     */
    var MessageSchema = new mongoose.Schema({
        __v: {
            type: Number,
            select: false
        },

        savedBy: {
            type: String,
            ref: 'Account'
        },

        // from Mailparser
        headers: Object,
        from: Array,
        to: Array,
        cc: Array,
        bcc: Array,
        subject: String,
        references: Array,
        inReplyTo: Array,
        priority: String,
        text: String,
        html: String,
        attachments: Array,

        // other fields
        inbox: String, // _id of Address
        originalInbox: String, // in case it was originally sent to the encrypted one
        encryptedInbox: String,
        domain: String,
        raw: String,
        received: Date,
        body: String // sanitized html
    });
    schemas.Message = MessageSchema;

    return schemas;
};
