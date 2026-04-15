package com.colabo.colabo.Controllers;

@RestController
public class ExampleController {
    @getMapping("/")
    String hola(){
        return "hola Mundo con Colabo";
    }
}
