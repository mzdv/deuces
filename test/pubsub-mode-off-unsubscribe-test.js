#!/usr/bin/env node

/* 
 * Deuces, pubsub mode events test.
 */

exports.test = function ( done ) {

    var debug = !! true
        , emptyFn = function () {}
        , log = console.log
        , dbg = debug ? console.log : emptyFn
        , assert = require( 'assert' )
        , Bolgia = require( 'bolgia' )
        , test_utils = require( './deps/test-utils' )
        , inspect = test_utils.inspect
        , format = test_utils.format
        , Deuces = require( '../' )
        , client = Deuces()
        // expected events
        , evts = []
        // collected events
        , collected = client.logger.collected
        , channels = [ 1, 2, 3 ]
        , i = 0
        , exit = typeof done === 'function' ? done : function () {}
        ;

    log( '- created new Deuces client with default options:', inspect( client.options ) );

    log( '- enable CLI logging.' );

    client.cli( true, function ( ename, args ) {
        dbg( '  !%s %s', ename, format( ename, args || [] ) );
    }, true );

    log( '- opening client connection.' );

    client.connect( null, function () {

        log( '- now client is connected and ready to send.' );

        // push expected events
        evts.push( 'connect', 'scanqueue', 'ready' );

        log( '- send unsubscribe without arguments when the client is not in PubSub mode.' );

        // push expected event
        evts.push( 'message' );
        for ( ; i < channels.length; ++i ) evts.push( 'message' );

        client.commands.unsubscribe( [], function ( is_err_reply, reply, fn ) {

            log( '- check, no "listen" or "shutup" events should be present.' );
            assert.ok( collected.events.indexOf( 'listen' ) < 0 );
            assert.ok( collected.events.indexOf( 'shutup' ) < 0 );

            log( '- client should not be in PubSub mode, now send PING and check reply, should be "OK".' );

            client.commands.unsubscribe( channels, function ( is_err_reply, reply, fn ) {

                log( '- UNSUBSCRIBE callback, check, no "listen" or "shutup" events should be present.' );
                assert.ok( collected.events.indexOf( 'listen' ) < 0 );
                assert.ok( collected.events.indexOf( 'shutup' ) < 0 );


                // execute code only on the final callback
                if ( --i === 0 ) {

                    // push expected event
                    evts.push( 'reply' );

                    client.commands.ping( function ( is_err_reply, reply, fn ) {

                        log( '- check PING reply, it should not be an error.' );
                        assert.ok( ! is_err_reply );

                        log( '- PING reply is:', inspect( fn( reply ) ) );
                        assert.deepEqual( fn( reply ), [ 'PONG' ] );

                    } );

                }

            } );

        } );

    } );

    log( '- now waiting 2 secs to collect events..' );

    setTimeout( function () {

        log( '- check the number of executions for multiple UNSUBSCRIBE command callback.' );
        assert.ok( i === 0 );

        log( '- now disconnecting client with QUIT.' );
        // push expected connection event
        evts.push( 'reply', 'offline', 'lost' );

        client.commands.quit( function ( is_err, reply, fn ) {
            log( '- QUIT callback.', fn( reply ) );
            assert.ok( fn( reply )[ 0 ] === 'OK' );
            log( '- OK, client was disconnected.' );
        } );

        setTimeout( function () {
            log( '- check collected events for client, should be:', inspect( evts ) );
             assert.deepEqual( collected.events, evts, 'got: ' + inspect( collected.events ) );

            exit();

        }, 1000 );

    }, 2000 );
    
};