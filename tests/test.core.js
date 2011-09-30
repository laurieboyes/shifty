function runCoreTests () {

  var quickTestDuration
      ,QUICK_TEST_DURATION = 250
      ,START_TEST_VAL = 0
      ,END_TEST_VAL = 10;

  function getTestInst () {
    var inst;

    inst = new Tweenable();
    inst.__deltaSum = 0;
    inst.__previousTestVal = START_TEST_VAL;

    return inst;
  }

  function simpleTestTween (inst, step, callback) {
    inst.tween({
      'from': {
        'testVal': START_TEST_VAL
      }
      ,'to': {
        'testVal': END_TEST_VAL
      }
      ,'duration': QUICK_TEST_DURATION
      ,'step': function () {
        inst.__deltaSum += inst.get().testVal - inst.__previousTestVal;
        inst.__previousTestVal = inst.get().testVal;
        
        // Faking the context of the `step` call
        step.call(inst._state.current);

        return inst;
      } 
      ,'callback': callback
    });
  }

  function runDeltaTest (inst) {
    ok( Math.abs((END_TEST_VAL - START_TEST_VAL) - inst.__deltaSum) < 1, 'Total step deltas were within 1.0 of the target amount.' );
  }

  quickTestDuration = 250
  module('Core tests');

  test('Generate a series of consecutively larger numbers.', function () {
    var inst
        ,generatedVals
        ,lastGeneratedVal
        ,valsAreInOrder;
   
    stop();
    inst = getTestInst();
    generatedVals = [];
    lastGeneratedVal = 0;
    valsAreInOrder = true;
      
    simpleTestTween(
      inst
      ,function step () {
        
        if (this.testVal >= lastGeneratedVal
          && valsAreInOrder === true) {
          
          // we're good!
        } else {
          // we're bad!  :(
          valsAreInOrder = false;
        }
        lastGeneratedVal = this.testVal;
      }, function callback () {

        ok(valsAreInOrder, 'Values were generated in order.');
        equal(this.testVal, END_TEST_VAL, 'Final generated value equals the target value.');
        runDeltaTest(inst);
        start();
      });
  });


  test('<code>.get</code> method gets an instance\'s current values.', function () {
    var inst
        ,retrievedVal;
    
    inst = getTestInst(); 
    stop();

    simpleTestTween(
      inst
      ,function step () {
        retrievedVal = inst.get().testVal;
      }, function callback () {
        equal(typeof retrievedVal, 'number', 'Sampled value is a number.');
        equal(inst.get().testVal, END_TEST_VAL, 'Final retrieved value equals the target value.');
        runDeltaTest(inst);
        start();
      });
  });

  test('<code>.pause</code> temporarily stops the animation calculation, and <code>resume</code> starts it from where it left off.', function () {
    var inst
        ,testValRightBeforePause
        ,testValRightBeforeResume
        ,stepCallCount
        ,startTimestamp
        ,endTimestamp
        ,pauseTime;
    
    function step () { 
      if (stepCallCount === 2) {
        testValRightBeforePause = inst.get().testVal;
        inst.pause();
          
        setTimeout(function () {
          testValRightBeforeResume = inst.get().testVal;
          inst.resume();
        }, pauseTime);
      }

      stepCallCount++;
    }
    
    stop();
    stepCallCount = 0;
    pauseTime = 500;
    inst = getTestInst();
    startTimestamp = Tweenable.util.now();
    
    simpleTestTween(
      inst
      ,step
      ,function callback () {
        endTimestamp = Tweenable.util.now();
        equal(testValRightBeforePause, testValRightBeforeResume, 'Test value did not change in the time it was changed and the time that the tween was `pause`d and when it was `resume`d.');
        ok( (endTimestamp - startTimestamp) >= (QUICK_TEST_DURATION + pauseTime), 'The duration of the pause is added to the actual duration of the tween.' );
        runDeltaTest(inst);
        start(); 
      }
    );
  });

  test('<code>stop</code> cancels a tween and brings it right to the end.', function () {
    var inst
        ,stepCallCount
        ,startTimestamp
        ,endTimestamp;
    
    function step () { 
      if (stepCallCount === 2) {
         inst.stop(true); 
      }

      stepCallCount++;
    }
    
    stop();
    stepCallCount = 0;
    previousTestVal = START_TEST_VAL;
    inst = getTestInst();
    startTimestamp = Tweenable.util.now();
    
    simpleTestTween(
      inst
      ,step
      ,function callback () {
        endTimestamp = Tweenable.util.now();
        ok( (endTimestamp - startTimestamp) < QUICK_TEST_DURATION, '`Stop`ped test did not last the full duration of the planned tween (it was successfully cancelled).');
        equal(inst.get().testVal, END_TEST_VAL, 'The value of the canceled tween parameter equals the target final value.');
        start(); 
      }
    );
  
  });

  test('Hook functions are executed in every step through an animation.', function () {
    var inst
        ,hookCallCount
        ,stepCallCount;

    stop();
    inst = getTestInst();
    hookCallCount = 0;
    stepCallCount = 0;
    inst.hookAdd('step', function () {
      hookCallCount++;
    });

    simpleTestTween(
      inst
      ,function step () {
        stepCallCount++;
      }
      ,function callback () {
        ok(hookCallCount > 0, 'The hook function was called more than once.');
        equal(hookCallCount, stepCallCount, 'The step function was called the same number of times as the step hook function.');
        start();
      }
    );
  });
}
