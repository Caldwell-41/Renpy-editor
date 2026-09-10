# Ren'Py 8.5 automated-test syntax exercised by the SDK adapter spike.
testsuite sdk_adapter:
    testcase arithmetic:
        assert eval (fixture_route_bonus("riverside") == 1)

    teardown:
        exit
