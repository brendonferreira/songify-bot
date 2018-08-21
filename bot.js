// Load up the discord.js library
const Discord = require("discord.js");

const client = new Discord.Client();

const config = require("./config.json");

const Peer = require('simple-peer')
const wrtc = require('wrtc')
const firebase = require('./config/firebase')

client.on('ready', ready => {
    console.log(`Logged in as ${client.user.tag}!`);

    // console.log( client.user )

    if( client.user.voiceChannel ) client.user.voiceChannel.leave()

});

client.on("message", async message => {


    if (message.author.bot) return;

    if (message.content.indexOf('++') < 0) return

    const command = message.content.replace('++ ', '++').replace('++', '')

    if (command === "ping") {
        
        const m = await message.channel.send("Ping?");
        m.edit(`Pong! Latency is ${m.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ping)}ms`);

    } else {

        const channel = message.member.voiceChannel;
        const voiceConnection = await channel.join()

        const key = Math.random().toString(36).substring(7);

        const database = firebase.database().ref('keys/'+key);

        database.set({
            type: 'request_session',
            key,
        })

        // console.log( key )

        console.log(  ['out', 'exit', 'getout', 'disconnect'].includes( command ) )
        if( ['out', 'exit', 'getout', 'disconnect'].includes( command ) ) {
            channel.leave()
        } else if( command == 'dev' ) {
            message.channel.send( 'http://localhost:8080/?key=' + key )
        } else {
            message.channel.send( 'https://songify-5f62f.firebaseapp.com/?key=' + key )
        }


        const peer = new Peer({
            initiator: false,
            trickle: false,
            config: {
                iceServers: [{
                    urls: 'stun:stun1.l.google.com:19302'
                },
                {
                    urls: 'stun:stun2.l.google.com:19302'
                }]
            },
            wrtc,
        })

        peer.on('signal', function (data) {
            database.update( data )
        })

        database.on('value', function( payload ) {
            const key = payload.val()

            if( !key ) {
                return;
            }

            if( key.type == 'offer' ) {
                try {
                    peer.signal( key )
                } catch( e ) {
                    console.log( e )
                }
            }
        })
        voiceConnection.playStream(peer);


    }
});

client.login(config.token)