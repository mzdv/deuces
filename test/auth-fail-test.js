#!/usr/bin/env node

/* 
 * Deuces, auth failing test.
 */

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
        security : {
            '127.0.0.1:6379' : {
                requirepass : 'fake'
            }
        }
    }
    , client = Deuces( opt )
    // expected events
    , evts = []
    // collected events
    , eresult = []
    ;

log( '- created new Deuces client with custom options:', inspect( opt ) );

log( '- enable CLI logging.' );

client.cli( true, function ( ename, args ) {
    eresult.push( ename );
    dbg( '  !%s %s', ename, format( ename, args || [] ) );
} );

log( '- opening client connection.' );

client.connect();

evts.push( 'connect', 'authfailed', 'error-reply', 'offline', 'lost' );

log( '- wait 1 second to collect events..' );

setTimeout( function () {

    log( '- check collected events from client, should be: %s.', inspect( evts ) );

    assert.deepEqual( eresult, evts, 'something goes wrong with client authorization! got: ' + inspect( eresult ) );

}, 1000 );
