#!/usr/bin/env node

/* 
 * Deuces, socket re-connection events test.
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
        , opt = {
            socket : {
                address : {
                    port : 9999
                }
            }
        }
        , client = Deuces( opt )
        // expected events
        , evts = []
        // collected events
        , collected = client.logger.collected
        , exit = typeof done === 'function' ? done : function () {}
        ;

    log( '- created new Deuces client with custom options:', inspect( opt ) );

    log( '- enable CLI logging.' );

    client.cli( true, function ( ename, args ) {
        dbg( '  !%s %s', ename, format( ename, args || [] ) );
    }, true );

    log( '- opening client connection to a not existent host to force reconnection: ', inspect( client.options.socket.address ) );

    // push expected events
    evts.push( 'offline', 'attempt', 'attempt', 'attempt', 'lost' );

    client.connect();

    log( '- wait 16 seconds to collect events..' );

    setTimeout( function () {
        log( '- check collected events from client, should be: %s.', inspect( evts ) );
        assert.deepEqual( collected.events, evts );

        log( '- opening connection to default Redis host:port.' );
        client.connect( { address : { port : 6379 } }, function () {

            log( '- now disconnecting client.' );
            client.disconnect( function () {
                log( '- client disconnected.' );

                // push expected events
                evts.push( 'connect', 'scanqueue', 'ready', 'offline', 'lost' );

                log( '- check collected events from client, should be: %s.', inspect( evts ) );
                assert.deepEqual( collected.events, evts, 'got: ' + inspect( collected.events ) );

                exit();

            } );

        } );

    }, 16000 );

};