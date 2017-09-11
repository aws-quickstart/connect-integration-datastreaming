console.log('Starting tblcreate.js');

var response = require('cfn-response');

const redshift = require('redshift-sql');

var config = {
    host: process.env['host_env'],
    db: process.env['db_env'],
    user: process.env['user_env'],
    password: process.env['password_env'],
    port: process.env['port_env']
};

var rssql = require('redshift-sql')(config);

var ctr = 'CREATE TABLE ctr (acw_end_tstamp TIMESTAMP,acw_start_tstamp TIMESTAMP, aws_account_id BIGINT NOT NULL, aws_ctr_format_ver VARCHAR(32), channel VARCHAR(255), conn_to_agent_tstamp TIMESTAMP, conn_to_ac_tstamp TIMESTAMP, contact_id VARCHAR(255), org_contact_id VARCHAR(255) distkey, ctr_init_tstamp TIMESTAMP, cust_addr_type VARCHAR(255), cust_addr_val VARCHAR(255), dequeue_tstamp TIMESTAMP, disc_tstamp TIMESTAMP sortkey, enqueue_tstamp TIMESTAMP, handle_attempts INTEGER, handled_by_agent VARCHAR(255), hold_dur INTEGER, init_tstamp TIMESTAMP, last_upd_tstamp TIMESTAMP, ac_addr_type VARCHAR(255), ac_addr_val VARCHAR(255), num_of_holds INTEGER, orig_contact_id VARCHAR(255), prev_contact_id VARCHAR(255), queue VARCHAR(255), rec_loc VARCHAR(255), tlk_duration INTEGER);';

var ctrattr = 'CREATE TABLE ctr_attr (aws_account_id BIGINT NOT NULL, org_id VARCHAR(255), contact_id VARCHAR(255) distkey, orig_contact_id VARCHAR(255), init_tstamp TIMESTAMP, disc_tstamp TIMESTAMP sortkey, last_upd_tstamp TIMESTAMP, attr_key VARCHAR(255), attr_val VARCHAR(255));';

rssql(ctr, function cb(err, result) {
    if (err) {
        return console.error(err);
    } else console.log(result);
});

rssql(ctrattr, function cb(err, result) {
    if (err) {
        return console.error(err);
    } else console.log(result);
});
