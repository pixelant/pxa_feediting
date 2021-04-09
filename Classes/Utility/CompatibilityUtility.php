<?php

declare(strict_types=1);

namespace TYPO3\CMS\FrontendEditing\Utility;

/*
 * This file is part of the TYPO3 CMS project.
 *
 * It is free software; you can redistribute it and/or modify it under
 * the terms of the GNU General Public License, either version 2
 * of the License, or any later version.
 *
 * For the full copyright and license information, please read the
 * LICENSE.txt file that was distributed with this source code.
 *
 * The TYPO3 project - inspiring people to share!
 */

use TYPO3\CMS\Backend\Utility\BackendUtility;
use TYPO3\CMS\Core\EventDispatcher\EventDispatcher;
use TYPO3\CMS\Core\Utility\ClassNamingUtility;
use TYPO3\CMS\Core\Utility\GeneralUtility;
use TYPO3\CMS\Core\Utility\StringUtility;
use TYPO3\CMS\Core\Utility\VersionNumberUtility;
use TYPO3\CMS\Extbase\Mvc\Exception\InvalidArgumentValueException;
use TYPO3\CMS\Extbase\SignalSlot\Dispatcher;

/**
 * Miscellaneous functions relating to compatibility with different TYPO3 versions
 */
class CompatibilityUtility
{
    /**
     * Returns true if the current TYPO3 version is less than $version
     *
     * @param string $version
     * @return bool
     */
    public static function typo3VersionIsLessThan($version)
    {
        return self::getTypo3VersionInteger() < VersionNumberUtility::convertVersionNumberToInteger($version);
    }

    /**
     * Returns true if the current TYPO3 version is less than or equal to $version
     *
     * @param string $version
     * @return bool
     */
    public static function typo3VersionIsLessThanOrEqualTo($version)
    {
        return self::getTypo3VersionInteger() <= VersionNumberUtility::convertVersionNumberToInteger($version);
    }

    /**
     * Returns true if the current TYPO3 version is greater than $version
     *
     * @param string $version
     * @return bool
     */
    public static function typo3VersionIsGreaterThan($version)
    {
        return self::getTypo3VersionInteger() > VersionNumberUtility::convertVersionNumberToInteger($version);
    }

    /**
     * Returns true if the current TYPO3 version is greater than or equal to $version
     *
     * @param string $version
     * @return bool
     */
    public static function typo3VersionIsGreaterThanOrEqualTo($version)
    {
        return self::getTypo3VersionInteger() >= VersionNumberUtility::convertVersionNumberToInteger($version);
    }

    /**
     * Returns the TYPO3 version as an integer
     *
     * @return int
     */
    public static function getTypo3VersionInteger()
    {
        return VersionNumberUtility::convertVersionNumberToInteger(VersionNumberUtility::getNumericTypo3Version());
    }

    /**
     * Dispatch an event as PSR-14 in TYPO3 v10+ and signal in TYPO3 v9.
     *
     * @param object $event
     * @return object
     */
    public static function dispatchEvent(object $event): object
    {
        if (self::typo3VersionIsLessThan('10')) {
            /** @var Dispatcher $signalSlotDispatcher */
            $signalSlotDispatcher = GeneralUtility::makeInstance(Dispatcher::class);

            $eventClassName = get_class($eventClassName);

            $signalSlotDispatcher->dispatch(
                $eventClassName,
                self::classNameToSignalName($eventClassName),
                [$event]
            );

            return $event;
        }

        /** @var EventDispatcher $eventDispatcher */
        $eventDispatcher = GeneralUtility::makeInstance(EventDispatcher::class);

        return $eventDispatcher->dispatch($event);
    }

    /**
     * Register a PSR-14 event as a signal slot in TYPO3 v9.
     *
     * @param string $eventClassName
     * @param string $eventHandlerClassName
     */
    public static function registerEventHandlerAsSignalSlot(string $eventClassName, string $eventHandlerClassName)
    {
        if (self::typo3VersionIsGreaterThanOrEqualTo('10')) {
            return;
        }

        /** @var Dispatcher $signalSlotDispatcher */
        $signalSlotDispatcher = GeneralUtility::makeInstance(Dispatcher::class);

        $signalSlotDispatcher->connect(
            $eventClassName,
            self::classNameToSignalName($eventClassName),
            $eventHandlerClassName,
            '__invoke'
        );
    }

    /**
     * Returns "className" from "Foo\Bar\ClassName".
     *
     * @param string $className
     * @return string
     */
    protected static function classNameToSignalName(string $className)
    {
        return lcfirst(array_pop(explode('\\', $className)));
    }
}
