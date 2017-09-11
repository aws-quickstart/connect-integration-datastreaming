'use strict';

console.log('Starting ctrprocessor.js');

var response = require('cfn-response');
var AWS = require('aws-sdk');
var firehose = new AWS.Firehose();
var ctr_streams = ['connect-ctr-to-rs'];
var attribute_streams = ['connect-ctr-attr-to-rs'];

exports.handler = (event, context, callback) = > {
    console.log('Received event:', JSON.stringify(event, null, 2));
    var transformAttributes = (ctr) = > {
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
    var putRecords = (stream, records) = > {
        var params = {
            DeliveryStreamName: stream,
            Records: []
        };
        records.forEach((record) = > {
            params.Records.push({
                Data: JSON.stringify(record)
            });
        });
        return firehose.putRecordBatch(params).promise();
    };
    var processRecords = (records, position) = > {
        if (position >= records.length) {
            callback(null, `Successfully processed $ {
                    position
                }
                records.`);
            return;
        }
        const record = records[position];
        const payload = new Buffer(record.kinesis.data, 'base64').toString('ascii');
        console.log('Decoded payload:', payload);
        const ctr = JSON.parse(payload);
        const attributes = transformAttributes(ctr);
        var promises = [];
        ctr_streams.forEach((stream) = > {
            promises.push(putRecords(stream, [ctr]));
        });
        if (attributes.length > 0) {
            attribute_streams.forEach((stream) = > {
                promises.push(putRecords(stream, attributes));
            });
        }
        Promise.all(promises).then(values = > {
            console.log('Wrote to streams: ', JSON.stringify(values));
            processRecords(records, position + 1);
        }).
        catch (reason = > {
            console.log('Failed to process record: ', payload, reason)
            callback(reason, `Failed to process record $ {
                position
            }`);
        });
    };
    processRecords(event.Records, 0);
};
