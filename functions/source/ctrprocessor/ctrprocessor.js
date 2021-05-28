// # -----------------------------------------------------------------------------------------
// # MIT No Attribution
// # Permission is hereby granted, free of charge, to any person obtaining a copy of this
// # software and associated documentation files (the "Software"), to deal in the Software
// # without restriction, including without limitation the rights to use, copy, modify,
// # merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
// # permit persons to whom the Software is furnished to do so.
// # THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
// # INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
// # PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
// # HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// # OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
// # SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
// # -----------------------------------------------------------------------------------------
'use strict';

var ctr_streams = ['connect-ctr-to-rs'];
var attribute_streams = ['connect-ctr-attr-to-rs'];
var AWS = require('aws-sdk');
var firehose = new AWS.Firehose();

console.log('Loading function');

exports.handler = (event, context, callback) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    var transformAttributes = (ctr) => {
        var attributes = [];

        for (var key in ctr.Attributes) {
            attributes.push({
                'AttributeKey': key,
                'AttributeValue': ctr.Attributes[key],
                'ContactId': ctr.ContactId,
                'AWSAccountId': ctr.AWSAccountId,
                'InitiationTimestamp': ctr.InitiationTimestamp,
                'DisconnectTimestamp': ctr.DisconnectTimestamp,
                'LastUpdateTimestamp': ctr.LastUpdateTimestamp,
                'InstanceARN': ctr.InstanceARN,
                'InitialContactId': ctr.InitialContactId
            });
        }
        return attributes;
    };

    var putRecords = (stream, records) => {
        var params = {
            DeliveryStreamName: stream,
            Records: []
        };
        records.forEach((record) => {
            params.Records.push({ Data: JSON.stringify(record) });
        });

        return firehose.putRecordBatch(params).promise();
    };

    var processRecords = (records, position) => {
        if (position >= records.length) {
            callback(null, `Successfully processed ${position} records.`);
            return;
        }
        const record = records[position];

        const payload = new Buffer.from(record.kinesis.data, 'base64').toString('ascii');
        console.log('Decoded payload:', payload);

        const ctr = JSON.parse(payload);
        const attributes = transformAttributes(ctr);

        var promises = [];

        ctr_streams.forEach((stream) => {
            promises.push(putRecords(stream, [ctr]));
        });

        if (attributes.length > 0) {
            attribute_streams.forEach((stream) => {
                promises.push(putRecords(stream, attributes));
            });
        }

        Promise.all(promises).then(values => {
            console.log('Wrote to streams: ', JSON.stringify(values));
            processRecords(records, position + 1);
        }).catch(reason => {
            console.log('Failed to process record: ', payload, reason)
            callback(reason, `Failed to process record ${position}`);
        });
    };

    processRecords(event.Records, 0);
};
