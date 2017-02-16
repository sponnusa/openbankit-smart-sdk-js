describe("integration tests", function () {
  // We need to wait for a ledger to close
  const TIMEOUT = 20*1000;
  this.timeout(TIMEOUT);
  this.slow(TIMEOUT/2);
  let server = new StellarSdk.Server('http://dev.stellar.attic.pw:8010');
  // let server = new StellarSdk.Server('http://127.0.0.1:8000');

  // let server = new StellarSdk.Server('http://127.0.0.1:8000');
  let bankSeed = "SAWVTL2JG2HTPPABJZKN3GJEDTHT7YD3TW5XWAWPKAE2NNZPWNNBOIXE";
  let bankPublicKey = "GAWIB7ETYGSWULO4VB7D6S42YLPGIC7TY7Y2SSJKVOTMQXV5TILYWBUA";
  let master = StellarSdk.Keypair.fromSeed(bankSeed);// .master();
// Emission:
// AccountID: GBDDGLK4VTHAATN3GCC7TY2UJHPGRMZ6QBZQS63PPRKUVWNEVZQ7A72Q
  let emissionSeed = "SDPSLVQAVYDA6K4GJARFL43DKZETIFFM7MWJ5JBQWEUCAIS5A5LQHYG6";

  // Admin AccountID: GDNN454CU3LP2LDFU5EDFEDH63O3W62BPC34YVDQOVFOTQQGIOEE7DLO
  let adminSeed = "SDFV2P5KAMWRUFPNA7DAAFEX327KWIZ26W5KTTGE4PBF4VBOYUD7PHVC";
  let createAccSeed = "SCD2AXMPMK2FYCDYSP6RMAHQ7J2W3XSFHFNVTXM2ACVT3OHD45NGQXSG";
  let userCreatingOthers = StellarSdk.Keypair.fromSeed(createAccSeed);
    


    // let buf = new Buffer("AAAAACyA/JPBpWot3Kh+P0uawt5kC/PH8alJKqumyF69mheLAAAAAAAAAAAAAAAJAAAAAAAAAAAAAAABAAAAAAAAAAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAZTFP/xeNB/ArZLeku6W5fle7IieG9PjLJ0T9oMC5AF4AAAABAAAAAQAAAAAAAAABvZoXiwAAAECXMPexpB4usY7joayzEDkRiTHkILnHv+3e9sdGlA2nX/JCXmC/5CGIiEPkj1Ju3A4PoNp2tmlezCRRCyC37TwCAAAAAA==", "base64");
    // let tXresult = StellarSdk.xdr.TransactionEnvelope.fromXDR(buf);
    // console.log("tXresult: ",JSON.stringify(tXresult, null, 2));

    
    //  let buffer = new Buffer("AAAAAP////sAAAAA", "base64");
    //        let tXresult2 = StellarSdk.xdr.TransactionResult.fromXDR(buffer);
    //        console.log("tXresult2: ",JSON.stringify(tXresult2, null, 2));
  // let tXresult = new StellarSdk.xdr.TransactionResult();
  // tXresult.result(new StellarSdk.xdr.TransactionResultResult(StellarSdk.xdr.TransactionResultCode.txBadSeq()));
  // tXresult.fees([]);
  // tXresult.ext(new StellarSdk.xdr.TransactionResultExt(0));
    console.log("userCreatingOthers accountId:", userCreatingOthers.accountId());
    console.log("userCreatingOthers seed:", userCreatingOthers.seed());

  console.log("master id: ", master.accountId())
  before(function(done) {
    this.timeout(60*1000);
    checkConnection(done);
  });

  function checkConnection(done) {
    server.loadAccount(master.accountId())
      .then(source => {
        console.log('Horizon up and running!');
        done();
      })
      .catch(err => {
        console.log("Couldn't connect to Horizon... Trying again.");
        setTimeout(() => checkConnection(done), 2000);
      });
  }

  function createNewAccount(accountId) {
    return server.loadAccount(userCreatingOthers.accountId())
      .then(source => {
        let tx = new StellarSdk.TransactionBuilder(source)
          .addOperation(StellarSdk.Operation.createAccount({
            destination: accountId,
            accountType: StellarSdk.xdr.AccountType.accountAnonymousUser().value
          }))
          .build();

        tx.sign(userCreatingOthers);

        return server.submitTransaction(tx);
      });
  }


// describe("/batch operations", function () {
//   let accountArray = [
// "GCZARTNF6URKLIZKFB7PNWWWJDLECG53SV36NMYAI73XYP3Y2EA3W4KD",
// "GAPFONPQES2HES2RZ63OHOWITCIHJZSAH3RSAUXNYQ3BZRO6ICVAV36N",
// "GDHEMUJBD6T4XTFCRAIZDOFGELQYEMMM6BG73XU5J2Q6EQUIARF6FULM",
// "GB3M2W5QGGX4VGPNET6NJQAYA3FW7WZNRMIHZKYZ57WTJQWENOZR27MI",
// "GCJJS3OIAMT6ZQPFBWBPRF5UWHVSKDRAQMLKDTEIBGOZLRCZ647CWAUW",
// "GAWEC6IKXBAPL4JO3LIV7ZMZXTS3X7IO24XVON5R2MEORI7EWQIJFNWF",
// "GCYASRP6NLG2KGAB3SCVRCVX73LCMPLBTFH3LGGXG6LBTX7AVVIOLZQ3",
// "GBEZU3D7E3JEKJSFA4AG45SDRRVWQDEK6OG72RT7JSUTRAH7PYRRBUJ4",
// "GCYH74SBB4CHLMD3MBUZNWK5FYZRRJLMQBY4HN3B3NLHBKFHNUO3Z5EZ",
// "GDIVZK7ACCR4GQNAMXA4EYQ6W4SSTZ4S75ZJDKNRB4FOJLCQTDZCPS2M",
// "GCNVLUTM7ZSYT65NSHEJAQVXVLM35SBD4KWHVV7ISGQHY7CMUZVAT7TA",
// "GDYBXVEJG7VPRNQ5P2772T7QTY3QXXBG4UUQZXZJH2GXXSCXL3LTNY7B",
// "GCRRNTU4JDY3TC7XN6J26H4FZ7YKBSYMTRDUOEPRC6FVKMFAFAMDQLQJ",
// "GCPNYUUXGOVPCIGTN7BYKI6D5QHI5EXC4F7GMHSQBZKBBGY7XPU6KED5",
// "GDQABZ3NVSI3HP45EUKGBBCYHYWMHOVOQRJVZFVKAFKEJ5OV3OL4CMQ5",
// "GCVFUN3N3FV43WBPS3DSGZJ3LTDA2ED3VEGZ7HA3ZEHTRE43HSAO6FM5",
// "GCS5NVDDWARZ6556N7UW3BW34RK2BSQRCEVNH3BZS7OXVW4DJDPZD3P2",
// "GA234KBMIG2WKSELJU2GWQS6G5RUSFD23PX5CCDJAWJKUGSPHYNOC3B6",
// "GA33OTTSB3ZDRTZ4FD5OH6QY7Q3IXFM4YCD6LOIT63XUSBKSPLJZF4OT",
// "GCX7WFZCVNUGXW5YFDX4PBIGYMTHHRKMGRFM74MKDNICKBOGR25YMRQQ",
// "GAEF3FGUPVQNTM6ASFY4FTEAKM43T664ESPBRI5326LQQ3UKULKAFDPE",
// "GBWZDAEAOWQ7M3E2AQWOYVZXBMFQE55LELTSBCKCIAW7D42YN7E44AKI",
// "GBKOGREIHAVK25HHTRLOGODV3BAF4Y2OALZKUAIUQEZ7476JNHVMEMKV",
// "GDAI4TT5FZFSZJE4NXZ54FHPMOJUWJYO4Z44IG4O4N5RLYHGWZ5GOAQD",
// "GCC5L2VKVMC27FZPA64CJM4AEOIRR3PEOXFVF6Q4MTSBO2XEXSCNOCUP",
// "GBS4FNFRYG6CJS6LCHB5WIHCQHPI4V75SAGKYYNJTM2NT7PEGOC2O2XR",
// "GD6KY4EZK6ZE5QKBT5VWQ4IJKWSWP4MRS3C7ZJBBBBEY5LSVM3S6KUV7",
// "GDPQBNIU3YT6PIYLTZ4JJY5CUBLDXNXBAMJ23HUAG7IOAHXHI4VP67BV",
// "GCCNZRIIFOFO652TSXRVR3A6YCR4EUINLCW4LWBP7HIBAWP655WS4MUR",
// "GAVWOKDSHAZUMPV2DPP37MPLKAMJ5V7ABCEW4JALKBMD5PETRRDJ3DI7",
// "GCHSK3FM7RD5YSUXT3C3EGMD3TEKWRDNXTGOCU6A26XWXB553XEMG22Q",
// "GBZ52GVMRCXQNUM3F3NJPLU5UKOV2PQ5YCO2742U6ZTNU6UTUAI7S36O",
// "GBCHCBXFHOIJ4ZM4SFTXU6LS4DEBCZ7GLWI7AF4BQAKTTEPFLTOJB5JV",
// "GBZZFKIGEFGFGWTTHASLROTHEHLFOE3VQ44NHRE5WQ7ZQ3SJOEEMQM3U",
// "GDPVU2INMSX2W2EJII2R6EGZ7LEC5BAJMJA7PYXLF2XNGNMG5SJMR2OQ",
// "GATKV5IH7STNLLO5O5XHILAM4DGTY6MNZ2UTSF3HMMFINPTF7TNYZ4TD",
// "GCA63U2HLRGFPSXJ2XNSEXCPEFWWC7PN7MU2MTVNJNY7ZXWJICUJAL72",
// "GDDGN6V6DEQ4LJ7CQ5ZWLQWSUU3QZIQ6D7477WBDJCEQWHM2JWPYCD2T",
// "GAIB2GZZCHRJI4MMIGBYTNI3MNBZ2GSIJTNJW4HDFDF6FH23VMJQ3GN7"];
//   it("batch balances", function (done) {
//     server.getBalances(accountArray)
//       .then(result => {
//         console.log("result: ", JSON.stringify(result, null, 2));
//         done();
//       })
//       .catch(err=>{
//         console.log("error: ", err);
//         done(err);
//       });
//   });
// });


// describe("/operations in transaction", function () {
//    it("operations", function (done) {
//     server.transactions()
//         .transaction("9d02bf5fe5286484e9a5f4cad404bba52415dab5b27cd33804084fefb9ce9cc6")
//         .call()
//         .then(function (transactionResult) {
//             console.log("transactionResult: ", JSON.stringify(transactionResult,null,2));
//             transactionResult.operations()
//             .then(function(operationsRes){
//               console.log("operationsRes: ", JSON.stringify(operationsRes,null,2));
            
//               done();
//             });
//         })

//     });
// });


  describe("/administration", function () {
    let distManagerKeyPair = StellarSdk.Keypair.fromSeed("SDRHAQQNAK7HPMP24254PTAVSLWNH7M345A5KESPQYKVT5JBBWCQ6E7H");
    let adminKeyPair = StellarSdk.Keypair.fromSeed(adminSeed);
    
    // it("set blocks on account", function (done) {
    //   server.restrictAgentAccount(distManagerKeyPair.accountId(),false,false, adminKeyPair, bankPublicKey)
    //   .then(result =>{
    //     console.log("result: ", result);
    //     done();
    //   })
    // });

    // it("set limits on account", function (done) {
    //   var limits = {
    //     max_operation_out: "10000",
    //     daily_max_out: "100000",
    //     monthly_max_out: "1000000",
    //     max_operation_in: "-1",
    //     daily_max_in: "-1",
    //     monthly_max_in: "-1"
    //   };

    //   server.loadAccount(bankPublicKey).then(function (source) {
    //       console.log("Creating limits");
    //       var op = StellarSdk.Operation.setAgentLimits(distManagerKeyPair.accountId(), 
    //       'EUAH',//new StellarSdk.Asset('EUAH', bankPublicKey), 
    //       limits);
    //       var tx = new StellarSdk.TransactionBuilder(source).addOperation(op).build();
    //       tx.sign(adminKeyPair);
    //       server.submitTransaction(tx)
    //       .then(result => {
    //         console.log("result: ", result);
    //         done();
    //       })
    //       .catch(err=>{
    //         console.log("error: ", err);
    //         done(err);
    //       });
    //   });
    // });


    it("set commission", function (done) {
      var opts = {
        // from: "GDNN454CU3LP2LDFU5EDFEDH63O3W62BPC34YVDQOVFOTQQGIOEE7DLO",
        // to: "GBDDGLK4VTHAATN3GCC7TY2UJHPGRMZ6QBZQS63PPRKUVWNEVZQ7A72Q",
        from_type: StellarSdk.xdr.AccountType.accountAnonymousUser().value.toString(),
        to_type: StellarSdk.xdr.AccountType.accountAnonymousUser().value.toString(),
        asset: new StellarSdk.Asset('EUAH', bankPublicKey)
      };
      var flat_fee = "1.2";
      var percent_fee = "0.1";
      server.loadAccount(bankPublicKey).then(function (source) {
        console.log("Creating commission");
        var op = StellarSdk.Operation.setCommission(opts, flat_fee, percent_fee);
        var tx = new StellarSdk.TransactionBuilder(source).addOperation(op).build();
        tx.sign(adminKeyPair);
        server.submitTransaction(tx)
        .then(result => {
            console.log("result: ", result);
            done();
          })
          .catch(err=>{
            console.log("error: ", err);
            done(err);
          });
      });
    });

    it("get commission", function (done) {
      var account_id = "GDNN454CU3LP2LDFU5EDFEDH63O3W62BPC34YVDQOVFOTQQGIOEE7DLO";
      var account_type = StellarSdk.xdr.AccountType.accountAnonymousUser().value;
      var asset = new StellarSdk.Asset('EUAH', bankPublicKey);
      server.commission()
      .forAccount(account_id)
      // .forAccountType(account_type)
      // .forAsset(asset)
      .call().then(result => {
            console.log("result: ", JSON.stringify(result,null,2));
            done();
          })
        .catch(err=>{
            console.log("error: ", err);
            done(err);
          });

    });

    it("calculate commission", function (done) {
      var source = "GDNN454CU3LP2LDFU5EDFEDH63O3W62BPC34YVDQOVFOTQQGIOEE7DLO";
      var destination = "GBDDGLK4VTHAATN3GCC7TY2UJHPGRMZ6QBZQS63PPRKUVWNEVZQ7A72Q";
      var asset = new StellarSdk.Asset('EUAH', bankPublicKey);
      var amount = "340";
      server.commission().calculate(source, destination, asset, amount).call().then(result => {
            console.log("result: ", JSON.stringify(result,null,2));
            done();
          })
        .catch(err=>{
            console.log("error: ", err);
            done(err);
          });
    });

    it("delete commission", function (done) {
      var opts = {
        // from: "GDNN454CU3LP2LDFU5EDFEDH63O3W62BPC34YVDQOVFOTQQGIOEE7DLO",
        // to: "GBDDGLK4VTHAATN3GCC7TY2UJHPGRMZ6QBZQS63PPRKUVWNEVZQ7A72Q",
        // from_type: StellarSdk.xdr.AccountType.accountAnonymousUser().value,
        // to_type: StellarSdk.xdr.AccountType.accountAnonymousUser().value,
        from_type: StellarSdk.xdr.AccountType.accountAnonymousUser().value.toString(),
        to_type: StellarSdk.xdr.AccountType.accountAnonymousUser().value.toString(),
        asset: new StellarSdk.Asset('EUAH', bankPublicKey)
      };
      server.loadAccount(bankPublicKey).then(function (source) {
        console.log("Deleting commission");
        var op = StellarSdk.Operation.deleteCommission(opts);
        var tx = new StellarSdk.TransactionBuilder(source).addOperation(op).build();
        tx.sign(adminKeyPair);
        server.submitTransaction(tx)
        .then(result => {

            let buffer = new Buffer(result.result_xdr, "base64");
            let tXresult = StellarSdk.xdr.TransactionResult.fromXDR(buffer);
            console.log("tXresult: ",JSON.stringify(tXresult));
            expect(result.ledger).to.be.not.null;
            done();
          })
        .catch(err=>{
            console.log("error: ", err);
            done(err);
          });
      });
    });


  });

  describe("/smart_transactions", function () {
    let emissionKeyPair = StellarSdk.Keypair.fromSeed(emissionSeed);
    let adminKeyPair = StellarSdk.Keypair.fromSeed(adminSeed);
    //Dist manager: GDDP7EL6EOTER4E4CVCT4IHKQKVHC5PPE7OONTGS5TLCGIFPYAOCDMO3
    // curl --data "account=GDDP7EL6EOTER4E4CVCT4IHKQKVHC5PPE7OONTGS5TLCGIFPYAOCDMO3&asset_code=EUAH&max_operation=5000&daily_turnnover=100000&monthly_turnover=1000000" http://127.0.0.1:8000/limits

    let distManagerKeyPair = StellarSdk.Keypair.fromSeed("SDRHAQQNAK7HPMP24254PTAVSLWNH7M345A5KESPQYKVT5JBBWCQ6E7H");
    let userCount = 10;
    let distManagerKeyPair2 = StellarSdk.Keypair.random();
    

    let user = StellarSdk.Keypair.random();
    // let users = [];
    // for (var i = 0; i < userCount; i++) {
    //   users.append(StellarSdk.Keypair.random());
    // }


    console.log("emissionKeyPair seed:", emissionKeyPair.seed());
    console.log("adminKeyPair seed:", adminKeyPair.seed());
    
    console.log("distManager accountId:", distManagerKeyPair.accountId());
    console.log("distManager seed:", distManagerKeyPair.seed());
    console.log("user accountId:", user.accountId());
    console.log("user seed:", user.seed());
    
    it("add an emission key signer", function (done) {

    //   // StellarSdk.EncryptedWalletStorage.getWallet("http://213.136.82.23:3005", "user105", "register", "smartmoney.com.ua").then(result => {
    //   //     done();
    //   //   })
    //   //   .catch(err => done(err));
    //   // lets prepare the tx for offline signing
    //   // this step is performed online
    // // createNewAccount(emissionKeyPair.accountId()).then(result => {
    // //       expect(result.ledger).to.be.not.null;
    // //       done();
    // //     })
    // //     .catch(err => done(err));
    // // console.log("emissionKeyPair accountId:", emissionKeyPair.accountId());
    // // console.log("emissionKeyPair seed:", emissionKeyPair.seed());
          

      server.loadAccount(bankPublicKey)
        .then(source => {
          source.seq
          console.log("account loaded");
          let addEmissionTx = new StellarSdk.TransactionBuilder(source)
            .addOperation(StellarSdk.Operation.setOptions({
              signer: {
                address: emissionKeyPair.accountId(),
                weight: 1,
                signerType: StellarSdk.xdr.SignerType.signerEmission().value
              }
            }))
            .addOperation(StellarSdk.Operation.setOptions({
              signer: {
                address: adminKeyPair.accountId(),
                weight: 1,
                signerType: StellarSdk.xdr.SignerType.signerAdmin().value
              }
            }))
            // .addOperation(StellarSdk.Operation.setOptions({
            //   signer: {
            //     address: "GA4RG3CYGRCQGGZMHWPRRSLGGKKZDRGD43CWFGXNT4MC6FJFC33EPJWN",
            //     weight: 1,
            //     signerType: StellarSdk.xdr.SignerType.signerEmission().value
            //   }
            // }))
            // .addOperation(StellarSdk.Operation.setOptions({
            //   signer: {
            //     address: "GDT373OOZOZZI4T3V6HRCJVJOLF7ZGIWLFMLPXM5GOCIKDGYDL5XMUR2",
            //     weight: 1,
            //     signerType: StellarSdk.xdr.SignerType.signerEmission().value
            //   }
            // }))
            // .addOperation(StellarSdk.Operation.setOptions({
            //   signer: {
            //     address: "GDZNGHR2PHZQHWQAKCWAAMWIIJZCLLJIAOODQO554EGVWJCEPLEH6C44",
            //     weight: 1,
            //     signerType: StellarSdk.xdr.SignerType.signerEmission().value
            //   }
            // }))
            // .addOperation(StellarSdk.Operation.setOptions({
            //   signer: {
            //     address: "GASR3FZQJ4QVPA5E35SWB4M4EIYERNEA7JVPZRXXTSMUDE6QH5RA5UBC",
            //     weight: 1,
            //     signerType: StellarSdk.xdr.SignerType.signerAdmin().value
            //   }
            // }))
            // .addOperation(StellarSdk.Operation.setOptions({
            //   signer: {
            //     address: "GC2NVMGTDMDPS3O57Q2LJZAQTTNYNGMEZEW62QFBBP7KVIEK22TDE2RC",
            //     weight: 1,
            //     signerType: StellarSdk.xdr.SignerType.signerAdmin().value
            //   }
            // }))
            // .addOperation(StellarSdk.Operation.setOptions({
            //   signer: {
            //     address: "GCQK4SFL2BEAKGG6XXG5FLWPWTTXRW7SFBKYIXCJ3KRT2EYD4QJ4MTJD",
            //     weight: 1,
            //     signerType: StellarSdk.xdr.SignerType.signerAdmin().value
            //   }
            // }))
            // .addOperation(StellarSdk.Operation.setOptions({
            //   signer: {
            //     address: "GDHHKDF2VOWGH7STZNAABONPVZBLNBNVPRWTZF6UODUJ6GDYZTGEYR7D",
            //     weight: 1,
            //     signerType: StellarSdk.xdr.SignerType.signerAdmin().value
            //   }
            // }))
            .build();
          let serializedTxString = addEmissionTx.toEnvelope().toXDR('base64');
          // Now we have a string, that represents an unsigned tx. This string is sent to the offline signer.

          let deserializedTx = new StellarSdk.Transaction(serializedTxString);
          // We can show the user all the fields in the tx, so he can verify what is he signing
          // console.log("deserializedTx:", deserializedTx);
          let offlineSigner = StellarSdk.Keypair.fromSeed(bankSeed);
          deserializedTx.sign(offlineSigner);
          // Now we have a signed transaction, that can be sent to the network 
          let signedSerializedTxString = deserializedTx.toEnvelope().toXDR('base64');
          // Lets get back online
          let signedDeserializedTx = new StellarSdk.Transaction(signedSerializedTxString);
console.log("Lets get back online ")
console.log(StellarSdk.Network.current().networkPassphrase())
          server.submitTransaction(signedDeserializedTx)
            .then(result => {
              console.log("result:", result);

              let buffer = new Buffer(result.result_xdr, "base64");
              let tXresult = StellarSdk.xdr.TransactionResult.fromXDR(buffer);
              console.log("tXresult: ",JSON.stringify(tXresult));
              // console.log("tXresult: ",tXresult);

              expect(result.ledger).to.be.not.null;
              done();
            })
            .catch(result => {
              console.log("catch result:", JSON.stringify(result, null, 2));
              done(result)
            });
        });
    });

it("add trusted asset",function(done){
    server.loadAccount(bankPublicKey).then(function (source) {
      var asset = new StellarSdk.Asset('EUAH', bankPublicKey);
      var isAnonymous = true;
      var isDelete = false;
      var op = StellarSdk.Operation.manageAssets(asset, isAnonymous, isDelete);
      var tx = new StellarSdk.TransactionBuilder(source).addOperation(op).build();
      tx.sign(adminKeyPair);
      server.submitTransaction(tx)
      .then(result =>{
       done();
     });
});
    });
    it("create a new account signed by admin", function (done) {
    server.loadAccount(bankPublicKey)
      .then(source => {
        let tx = new StellarSdk.TransactionBuilder(source)
          .addOperation(StellarSdk.Operation.createAccount({
            destination: distManagerKeyPair.accountId(),
            accountType: StellarSdk.xdr.AccountType.accountDistributionAgent().value
          }))
          // .addOperation(StellarSdk.Operation.createAccount({
          //   destination: userCreatingOthers.accountId(),
          //   accountType: StellarSdk.xdr.AccountType.accountAnonymousUser().value
          // }))
          .build();

        tx.sign(adminKeyPair);
        server.submitTransaction(tx)
        .then(result => {
              expect(result.ledger).to.be.not.null;
              done();
            })
        .catch(result => {
          console.log("exception!", JSON.stringify(result));
          done(result)});;
      });
    });

    it("set trust from dist manager to the bank in EUAH", function (done) {
    server.loadAccount(distManagerKeyPair.accountId())
      .then(source => {
        let tx = new StellarSdk.TransactionBuilder(source)
          .addOperation(StellarSdk.Operation.changeTrust({
            asset: new StellarSdk.Asset('EUAH', bankPublicKey)
          }))
          .build();

        tx.sign(distManagerKeyPair);
        server.submitTransaction(tx)
        .then(result => {
              expect(result.ledger).to.be.not.null;
              done();
            })
        .catch(result => done(result));;
      });
    });


//     // it("transition tx", function (done) {
//     // server.loadAccount(bankPublicKey)
//     //   .then(source => {
//     //     let tx = new StellarSdk.TransactionBuilder(source)
//     //       .addOperation(StellarSdk.Operation.payment({
//     //         destination: distManagerKeyPair.accountId(),
//     //         source: bankPublicKey,
//     //         amount: "10000.00", //lets say this is 10 000.00 UAH
//     //         asset: new StellarSdk.Asset('EUAH', bankPublicKey)
//     //       }))
//     //       .addOperation(StellarSdk.Operation.payment({
//     //         destination: user.accountId(),
//     //         source: distManagerKeyPair.accountId(),
//     //         amount: "10000.00", //lets say this is 10 000.00 UAH
//     //         asset: new StellarSdk.Asset('EUAH', bankPublicKey)
//     //       }))
          
//     //       .build();

//     //     tx.sign(emissionKeyPair);
//     //     tx.sign(distManagerKeyPair);
//     //     console.log("tx: ",JSON.stringify(tx));
//     //     server.submitTransaction(tx)
//     //     .then(result => {
//     //           console.log("result: ", JSON.stringify(result));
//     //           expect(result.ledger).to.be.not.null;
//     //           let buffer = new Buffer(result.result_xdr, "base64");
//     //           let tXresult = StellarSdk.xdr.TransactionResult.fromXDR(buffer);
//     //           console.log("tXresult: ",JSON.stringify(tXresult,null,2));

//     //           done();
//     //         })
//     //     .catch(result => {console.log("catch: ", result);
//     //       done(result)});;
//     //   });
//     // });

    it("issue some money to distribution manager signed by emission manager", function (done) {
    server.loadAccount(bankPublicKey)
      .then(source => {
        let tx = new StellarSdk.TransactionBuilder(source)
          .addOperation(StellarSdk.Operation.payment({
            destination: distManagerKeyPair.accountId(),
            // source: bankPublicKey,
            amount: "10000000.00", //lets say this is 100 000.00 UAH
            asset: new StellarSdk.Asset('EUAH', bankPublicKey)
          }))
          .build();

        tx.sign(emissionKeyPair);
        console.log("tx: ",JSON.stringify(tx));
        server.submitTransaction(tx)
        .then(result => {
              expect(result.ledger).to.be.not.null;
              let buffer = new Buffer(result.result_xdr, "base64");
              let tXresult = StellarSdk.xdr.TransactionResult.fromXDR(buffer);
              console.log("tXresult: ",JSON.stringify(tXresult,null,2));

              done();
            })
        .catch(result => {console.log("catch: ", result);
          done(result)});;
      });
    });


    it("send some money to the client", function (done) {
    server.loadAccount(distManagerKeyPair.accountId())
      .then(source => {
        let tx = new StellarSdk.TransactionBuilder(source)
          .addOperation(StellarSdk.Operation.payment({
            destination: "GADM2JGMD56QPHTDJPXZYFF4J6VWC45S4JJOJ2KKWL75IFJLRE5S5E5R",
            amount: "30.00", //lets say this is 100.00 UAH
            asset: new StellarSdk.Asset('EUAH', bankPublicKey)//distManagerKeyPair.accountId())
          }))
          // .addOperation(StellarSdk.Operation.payment({
          //   destination: "GADM2JGMD56QPHTDJPXZYFF4J6VWC45S4JJOJ2KKWL75IFJLRE5S5E5R",
          //   amount: "60.00", //lets say this is 100.00 UAH
          //   asset: new StellarSdk.Asset('EUAH', bankPublicKey)
          // }))
          .build();

        tx.sign(distManagerKeyPair);
        server.submitTransaction(tx)
        .then(result => {
              expect(result.ledger).to.be.not.null;
              done();
            })
        .catch(result => {console.log("exception!", JSON.stringify(result, null, 2));done(result);});;
      });
    });

    


  });

//   describe("/accounts", function () {
//     it("lists all accounts", function (done) {
//       server.accounts()
//         .call()
//         .then(accounts => {
//           // The first account should be a master account
//           expect(accounts.records[0].account_id).to.equal(master.accountId());
//           done();
//         });
//     });

//     it("stream accounts", function (done) {
//       this.timeout(10*1000);
//       let randomAccount = StellarSdk.Keypair.random();

//       let eventStream;
//       eventStream = server.accounts()
//         .cursor('now')
//         .stream({
//           onmessage: account => {
//             expect(account.account_id).to.equal(randomAccount.accountId());
//             done();
//           }
//         });

//       createNewAccount(randomAccount.accountId());
//       setTimeout(() => eventStream.close(), 10*1000);
//     });
//   });
});
