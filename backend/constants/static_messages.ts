export class ProjectMessages {
  static ProjectCreatedSuccessfully = 'Проект создан.';
  static ProjectsFetchedSuccessfully = 'Проекты получены.';
  static ProjectFetchedSuccessfully = 'Проект получен.';
  static ProjectUpdatedSuccessfully = 'Проект обновлён.';
  static ProjectDeletedSuccessfully = 'Проект удалён.';
  static ProjectNotFound = 'Проект не найден.';
  static ProjectKeyAlreadyExists = 'Проект с таким ключом уже есть.';
  static NameAndKeyRequired = 'Укажите название и ключ.';
  static InvalidNameLength = 'Длина названия — от 3 до 255 символов.';
  static InvalidKeyLength = 'Длина ключа — от 2 до 10 символов.';
  static InvalidKeyFormat = 'Ключ может содержать только буквы и цифры.';
  static FailedToCreateProject = 'Не удалось создать проект.';
  static FailedToUpdateProject = 'Не удалось обновить проект.';
  static FailedToDeleteProject = 'Не удалось удалить проект.';
}

export class ProjectMemberMessages {
  static MemberAddedSuccessfully = 'Участник добавлен.';
  static MemberRemovedSuccessfully = 'Участник удалён.';
  static MembersFetchedSuccessfully = 'Участники получены.';
  static EmailOrUserIdRequired = 'Укажите email или ID пользователя.';
  static InvalidRole = 'Некорректная роль: допустимы OWNER, ADMIN, TESTER, VIEWER.';
  static UserAlreadyMember = 'Пользователь уже участник проекта.';
  static UserNotFound = 'Пользователь не найден.';
  static UserWithEmailNotFound = 'Пользователь с таким email не найден.';
  static MemberNotFound = 'Участник не найден в этом проекте.';
  static CannotRemoveLastOwner = 'Нельзя удалить последнего владельца проекта.';
  static FailedToAddMember = 'Не удалось добавить участника в проект.';
  static FailedToRemoveMember = 'Не удалось удалить участника из проекта.';
}

export class TestCaseMessages {
  static TestCaseCreatedSuccessfully = 'Тест-кейс создан.';
  static TestCasesFetchedSuccessfully = 'Тест-кейсы получены.';
  static TestCaseFetchedSuccessfully = 'Тест-кейс получен.';
  static TestCaseUpdatedSuccessfully = 'Тест-кейс обновлён.';
  static TestCaseDeletedSuccessfully = 'Тест-кейс удалён.';
  static TestCaseNotFound = 'Тест-кейс не найден.';
  static TestStepsUpdatedSuccessfully = 'Шаги обновлены.';
  static TestCaseStatsFetchedSuccessfully = 'Статистика тест-кейсов получена.';
  static TitleRequired = 'Укажите название.';
  static TitleCannotBeEmpty = 'Название не может быть пустым.';
  static InvalidPriority = 'Некорректный приоритет.';
  static InvalidStatus = 'Некорректный статус.';
  static InvalidEstimatedTime = 'Оценка времени должна быть положительным числом.';
  static StepsMustBeArray = 'Шаги должны быть списком.';
  static InvalidStepFormat = 'У каждого шага должны быть действие и ожидаемый результат.';
  static InvalidStepNumber = 'Номера шагов должны быть положительными целыми числами.';
  static FailedToFetchTestCase = 'Не удалось загрузить тест-кейс.';
  static FailedToUpdateTestCase = 'Не удалось обновить тест-кейс.';
  static FailedToDeleteTestCase = 'Не удалось удалить тест-кейс.';
  static FailedToUpdateTestSteps = 'Не удалось обновить шаги.';
  static TestCasesExportedSuccessfully = 'Тест-кейсы выгружены.';
  static FailedToExportTestCases = 'Не удалось выгрузить тест-кейсы.';
  static InvalidExportFormat = 'Неверный формат выгрузки: используйте csv или excel.';
}

export class ModuleMessages {
  static ModuleCreatedSuccessfully = 'Модуль создан.';
  static ModulesFetchedSuccessfully = 'Модули получены.';
  static ModuleFetchedSuccessfully = 'Модуль получен.';
  static ModuleUpdatedSuccessfully = 'Модуль обновлён.';
  static ModuleDeletedSuccessfully = 'Модуль удалён.';
  static ModuleNotFound = 'Модуль не найден.';
  static ModulesReorderedSuccessfully = 'Порядок модулей изменён.';
  static NameRequired = 'Укажите название модуля.';
  static NameCannotBeEmpty = 'Название модуля не может быть пустым.';
  static NameAlreadyExists = 'Модуль с таким названием уже есть в проекте.';
  static ModuleNameAlreadyExists = 'Модуль с таким названием уже есть в проекте.';
  static InvalidModuleOrder = 'Некорректный порядок модулей.';
  static ModuleContainsTestCases = 'Нельзя удалить модуль, в котором есть тест-кейсы.';
  static CannotDeleteModuleWithTestCases = 'Нельзя удалить модуль, в котором есть тест-кейсы.';
  static FailedToCreateModule = 'Не удалось создать модуль.';
  static FailedToUpdateModule = 'Не удалось обновить модуль.';
  static FailedToDeleteModule = 'Не удалось удалить модуль.';
  static FailedToReorderModules = 'Не удалось изменить порядок модулей.';
  static FailedToFetchModules = 'Не удалось загрузить модули.';
}

export class AuthMessages {
  static UserSignedInSuccessfully = 'Вход выполнен.';
  static LoginSuccessful = 'Вход выполнен.';
  static EmailAlreadyRegistered = 'Этот email уже зарегистрирован.';
  static InvalidPassword = 'Неверный пароль.';
  static PasswordResetCodeSentSuccessfully = 'Код для сброса пароля отправлен.';
  static PasswordChangedSuccessfully = 'Пароль изменён.';
  static ResetPasswordFailed = 'Не удалось сбросить пароль.';
  static ResetPasswordCodeSentFailed = 'Не удалось отправить код сброса пароля.';
  static UserCreatedSuccessfully = 'Пользователь создан.';
  static PasswordResetInstructionsSent = 'Инструкция по сбросу пароля отправлена на почту.';
  static PasswordResetSuccessfully = 'Пароль сброшен. Войдите с новым паролем.';
  static UserAlreadyExists = 'Пользователь с таким email уже есть.';
  static CurrentPasswordIncorrect = 'Текущий пароль указан неверно.';
  static NewPasswordMustBeDifferent = 'Новый пароль должен отличаться от текущего.';
}

export class EmailMessages {
  static EmailServiceConfigured = 'Почтовый сервис настроен и готов.';
  static EmailServiceNotConfigured = 'Почтовый сервис не настроен: задайте переменные окружения SMTP.';
  static EmailSentSuccessfully = 'Письмо отправлено.';
  static EmailSendFailed = 'Не удалось отправить письмо.';
}

export class DefectMessages {
  static DefectCreatedSuccessfully = 'Дефект создан.';
  static DefectsFetchedSuccessfully = 'Дефекты получены.';
  static DefectFetchedSuccessfully = 'Дефект получен.';
  static DefectUpdatedSuccessfully = 'Дефект обновлён.';
  static DefectDeletedSuccessfully = 'Дефект удалён.';
  static DefectLinkedSuccessfully = 'Дефект связан.';
  static DefectUnlinkedSuccessfully = 'Связь с дефектом удалена.';
  static DefectNotFound = 'Дефект не найден.';
  static DefectAssignmentEmailSent = 'Письмо о назначении дефекта отправлено.';
  static FailedToCreateDefect = 'Не удалось создать дефект.';
  static FailedToUpdateDefect = 'Не удалось обновить дефект.';
  static FailedToDeleteDefect = 'Не удалось удалить дефект.';
  static FailedToLinkDefect = 'Не удалось связать дефект.';
  static FailedToUnlinkDefect = 'Не удалось удалить связь с дефектом.';
  static DefectsExportedSuccessfully = 'Дефекты выгружены.';
  static FailedToExportDefects = 'Не удалось выгрузить дефекты.';
}

export class UserMessages {
  static UserFetchedSuccessfully = 'Пользователь получен.';
  static UserUpdatedSuccessfully = 'Пользователь обновлён.';
  static UserDeletedSuccessfully = 'Пользователь удалён.';
  static UserNotFound = 'Пользователь не найден.';
  static FetchUserDetailsFailed = 'Не удалось получить данные пользователя.';
  static UpdateUserFailed = 'Не удалось обновить пользователя.';
  static MissingClientCredentials = 'Не переданы учётные данные клиента.';
  static FetchAccessTokenFailed = 'Не удалось получить токен доступа.';
}

export class AuthorizationMessages {
  static PrivilegesFetchedSuccessfully = 'Права получены.';
  static RoleNotFound = 'Роль не найдена.';
  static FailedToFetchRoles = 'Не удалось загрузить роли.';
  static MenuListFetchedSuccessfully = 'Меню получено.';
  static AccessListFetchedSuccessfully = 'Список доступа получен.';
  static NotAuthorized = 'Нет доступа к этому ресурсу.';
  static InsufficientPermissions = 'Недостаточно прав для этого действия.';
}

export class GeneralMessages {
  static OperationSuccessful = 'Готово.';
  static OperationFailed = 'Операция не выполнена.';
  static InvalidRequest = 'Некорректный запрос.';
  static InternalServerError = 'Внутренняя ошибка сервера.';
  static ResourceNotFound = 'Не найдено.';
  static BadRequest = 'Некорректный запрос.';
  static Unauthorized = 'Требуется вход.';
  static Forbidden = 'Доступ запрещён.';
}

export class TestSuiteMessages {
  static TestSuitesFetchedSuccessfully = 'Тест-сьюты получены.';
  static TestSuiteFetchedSuccessfully = 'Тест-сьют получен.';
  static TestSuiteCreatedSuccessfully = 'Тест-сьют создан.';
  static TestSuiteUpdatedSuccessfully = 'Тест-сьют обновлён.';
  static TestSuiteDeletedSuccessfully = 'Тест-сьют удалён.';
  static TestSuitesReorderedSuccessfully = 'Порядок тест-сьютов изменён.';
  static TestCasesMovedSuccessfully = 'Тест-кейсы перемещены.';
  static ModuleAddedToSuiteSuccessfully = 'Модуль добавлен в сьют.';
  static ModuleUpdatedInSuiteSuccessfully = 'Модуль в сьюте обновлён.';
  static ModuleRemovedFromSuiteSuccessfully = 'Модуль убран из сьюта.';
  static TestSuiteNotFound = 'Тест-сьют не найден.';
  static SuiteNameRequired = 'Укажите название сьюта.';
  static SuiteNameCannotBeEmpty = 'Название сьюта не может быть пустым.';
  static InvalidSuiteParent = 'Некорректный родительский сьют.';
  static ModuleNotFound = 'Модуль не найден.';
  static ModuleIDRequired = 'Укажите ID модуля.';
  static NewModuleIDRequired = 'Укажите ID нового модуля.';
  static FailedToFetchTestSuite = 'Не удалось загрузить тест-сьют.';
  static FailedToCreateTestSuite = 'Не удалось создать тест-сьют.';
  static FailedToUpdateTestSuite = 'Не удалось обновить тест-сьют.';
  static FailedToDeleteTestSuite = 'Не удалось удалить тест-сьют.';
  static FailedToMoveTestCases = 'Не удалось переместить тест-кейсы.';
  static FailedToReorderTestSuites = 'Не удалось изменить порядок тест-сьютов.';
  static FailedToAddModuleToSuite = 'Не удалось добавить модуль в сьют.';
  static FailedToUpdateModuleInSuite = 'Не удалось обновить модуль в сьюте.';
  static FailedToRemoveModuleFromSuite = 'Не удалось убрать модуль из сьюта.';
  static TestCasesAddedToSuiteSuccessfully = 'Тест-кейсы добавлены в сьют.';
  static TestCasesRemovedFromSuiteSuccessfully = 'Тест-кейсы убраны из сьюта.';
  static TestCasesCheckedSuccessfully = 'Тест-кейсы проверены.';
  static TestCaseIDsRequired = 'Укажите ID тест-кейсов.';
  static FailedToAddTestCasesToSuite = 'Не удалось добавить тест-кейсы в сьют.';
  static FailedToRemoveTestCasesFromSuite = 'Не удалось убрать тест-кейсы из сьюта.';
  static FailedToCheckTestCasesInSuite = 'Не удалось проверить тест-кейсы сьюта.';
  static AccessDeniedTestSuite = 'Нет доступа: тест-сьютами управляют владельцы и администраторы проекта.';
}

export class TestRunMessages {
  static TestRunsFetchedSuccessfully = 'Тест-раны получены.';
  static TestRunFetchedSuccessfully = 'Тест-ран получен.';
  static TestRunCreatedSuccessfully = 'Тест-ран создан.';
  static TestRunUpdatedSuccessfully = 'Тест-ран обновлён.';
  static TestRunDeletedSuccessfully = 'Тест-ран удалён.';
  static TestRunStartedSuccessfully = 'Тест-ран запущен.';
  static TestRunCompletedSuccessfully = 'Тест-ран завершён.';
  static TestRunReportSentSuccessfully = 'Отчёт по тест-рану отправлен.';
  static TestRunNotFound = 'Тест-ран не найден.';
  static TestRunNameRequired = 'Укажите название тест-рана.';
  static TestRunNameCannotBeEmpty = 'Название тест-рана не может быть пустым.';
  static InvalidTestRunStatus = 'Некорректный статус тест-рана.';
  static NoTestCases = 'Тест-кейсы не переданы.';
  static NoRecipientsFound = 'Нет получателей для отчёта.';
  static NoValidEmailAddresses = 'Нет получателей с корректным email.';
  static FailedToFetchTestRun = 'Не удалось загрузить тест-ран.';
  static FailedToCreateTestRun = 'Не удалось создать тест-ран.';
  static FailedToUpdateTestRun = 'Не удалось обновить тест-ран.';
  static FailedToDeleteTestRun = 'Не удалось удалить тест-ран.';
  static FailedToStartTestRun = 'Не удалось запустить тест-ран.';
  static FailedToCompleteTestRun = 'Не удалось завершить тест-ран.';
  static FailedToSendTestRunReport = 'Не удалось отправить отчёт по тест-рану.';
  static AccessDeniedTestRun = 'Нет доступа: тест-ранами управляют владельцы и администраторы проекта.';
  static TestRunsExportedSuccessfully = 'Тест-раны выгружены.';
  static FailedToExportTestRuns = 'Не удалось выгрузить тест-раны.';
}
