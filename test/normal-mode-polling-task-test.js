#!/usr/bin/env node

/* 
 * Spade, polling task test.
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
        , times = 5
        , intval = 1000
        , args = []
        , exit = typeof done === 'function' ? done : function () {}
        ;

    log( '- created new Spade client with default options:', inspect( client.options ) );

    log( '- enable CLI logging.' );

    client.cli( true, function ( ename, args ) {
        dbg( '  !%s %s', ename, format( ename, args || [] ) );
    }, true );

    log( '- opening client connection.' );

    client.connect( null, function () {
        var i = 0
            ;
        log( '- now client is connected and ready to send.' );
        // push expected events
        evts.push( 'connect', 'scanqueue', 'ready' );

        log( '- now #initTasks.' );
        client.initTasks();

        // push expected events
        for ( ; i < times; ++i ) evts.push( 'polling', 'reply' );

        // start polling, ping without message for Redis < 2.8.x
        log( '- start polling, interval: %s, args: %s, times: %s.', inspect( intval ), inspect( args ), inspect( times ) );
        client.tasks.polling.run( intval, args, times );

    } );

    log( '- now waiting %s secs to collect events..', inspect( 2 * intval * times / 1000 ) );

    setTimeout( function () {

        var i = 0
            ;

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

    }, 2 * intval * times );

};