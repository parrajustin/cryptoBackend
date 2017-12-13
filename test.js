
const virtualbox = require("virtualbox-soap");
const co = require("co");
const guid = require('guid');

// const a = co(function *() {
//   try {
//       const serverURL = "http://192.168.43.165:18083"; // This url is the default one, it can be omitted 
//       const websessionManager = yield virtualbox(serverURL);
//       // console.log(websessionManager);
//       const vbox = yield websessionManager.logon('jparra', '384478');
//       const session = yield websessionManager.getSessionObject(vbox);
//       let machines;
//       try {
//         machines = yield vbox.getMachines();
//       } catch(error) {
//         machines = [];
//       }
//       // console.log(JSON.stringify(vbox));
//       connection.query(
//         "INSERT INTO `server` (`user_name`, `password`, `status`, `ip_address`) " +
//         "VALUES (?, ?, 'setting up', ?);"
//         , [req.body['user'], req.body['pass'], req.body['ip']], function (error, results, fields) {

//         // Handle error after the release.
//         if (error) {
//           connection.release();
//           throw error;
//         }
//       });


      
//       const len = machines.length;

//       for (let i = 0; i < len; i++) {
//         const vm = {
//           'VMname': '',
//           'VMvrdp': 0,
//           'VMrecent_snapshot': '',
//           'VMhost_server': req.body['ip'],
//           'VMUID': ''
//         };

//         // const netAdapters = [];
//         let query = [];
//         const netArray = [];

//         const machine = machines[i];

//         const uid = yield machine.getId();
//         const name = yield machine.getName();

//         vm['VMUID'] = uid;
//         vm['VMname'] = name;

//         connection.query(
//           "INSERT INTO `virtual_machine` (`VMname`, `VMvrdp`, `VMrecent_snapshot`, `VMhost_server`, `VMUID`) " +
//           "VALUES (?, ?, ?, ?, ?);"
//           , [vm['VMname'], vm['VMvrdp'], vm['VMrecent_snapshot'], vm['VMhost_server'], vm['VMUID']], function (error, results, fields) {
          
//           // Handle error after the release.
//           if (error) {
//             connection.release();
//             throw error;
//           }
//         });

//         for (let j = 0; j < 4; j++) {
//           const net = yield machine.getNetworkAdapter(j);
//           const bool = yield net.getEnabled();

//           if (!bool) {
//             continue;
//           }

//           const type = yield net.getAdapterType();
//           const instance = yield net.getMACAddress();

//           // netAdapters.push(type + '_' + instance);
//           query.push('(?, ?)');
//           netArray.push(vm['VMname'], type + '_' + instance);
//         }

//         if (query.length > 0) {
//           connection.query(
//             "INSERT INTO `vm_netadapters` (`VMname`, `Network_Adapter`) " +
//             "VALUES " + query.join(', ') + ";"
//             , netArray, function (error, results, fields) {

            
//             // Handle error after the release.
//             if (error) {   
//               // And done with the connection.
//               connection.release();
//               throw error;
//             }
//           });
//         }
//       }

//       websessionManager.logoff(vbox)
//       // ... 
//   } catch (error) {
//       console.error(error + "");
//   }
// });
console.log(guid.raw());
console.log('outside');
a.then((value) => {
  console.log(a);
})